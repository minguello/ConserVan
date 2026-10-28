import { probarConexion } from './probarConexion';
import { supabase } from './supabase';
import { useEffect, useState } from 'react';

const sections = [
  { id: 'inicio', label: 'Inicio', icon: '⌂' },
  { id: 'alumnos', label: 'Alumnos', icon: '♙' },
  { id: 'clases', label: 'Clases recurrentes', icon: '▦' },
  { id: 'desplazamientos', label: 'Desplazamientos', icon: '➜' },
  { id: 'asignaciones', label: 'Asignaciones', icon: '✓' },
  { id: 'cambios', label: 'Cambios de clase', icon: '↻' },
  { id: 'grupo', label: 'Mi grupo', icon: '♧' },
];

const descriptions = {
  inicio: {
    title: 'Inicio',
    text: 'Bienvenido a ConserVan.',
    items: ['Resumen del grupo', 'Próximas actividades'],
  },
  alumnos: {
    title: 'Alumnos',
    text: 'Gestión de los alumnos del grupo.',
    items: ['Listado de alumnos', 'Información del alumno'],
  },
  clases: {
    title: 'Clases recurrentes',
    text: 'Organiza las clases que se repiten cada semana.',
    items: ['Horario semanal', 'Actividades recurrentes'],
  },
  desplazamientos: {
    title: 'Desplazamientos',
    text: 'Consulta las ofertas de desplazamiento.',
    items: ['Ofertas disponibles', 'Mis ofertas'],
  },
  asignaciones: {
    title: 'Asignaciones',
    text: 'Consulta las asignaciones de desplazamiento.',
    items: ['Asignaciones', 'Estado de cada asignación'],
  },
  cambios: {
    title: 'Cambios de clase',
    text: 'Consulta cambios y modificaciones de horarios.',
    items: ['Consultar cambios', 'Cambios recientes'],
  },
  grupo: {
    title: 'Mi grupo',
    text: 'Información y configuración del grupo.',
    items: ['Información del grupo', 'Mi perfil'],
  },
};

const alumnoVacio = {
  nombre: '',
  apellidos: '',
  telefono: '',
  email: '',
  observaciones: '',
  activo: true,
};

const claseVacia = {
  nombre: '',
  profesor: '',
  dia_semana: '1',
  hora_inicio: '09:00',
  hora_fin: '10:00',
  lugar: '',
  observaciones: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: '',
  activa: true,
};

const diasSemana = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '7', label: 'Domingo' },
];

export default function App() {
  const [active, setActive] = useState('inicio');
  const [menuOpen, setMenuOpen] = useState(false);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);

  const [alumnos, setAlumnos] = useState([]);
  const [alumnosLoading, setAlumnosLoading] = useState(false);
  const [alumnosError, setAlumnosError] = useState('');
  const [mostrarFormularioAlumno, setMostrarFormularioAlumno] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [alumnoForm, setAlumnoForm] = useState({ ...alumnoVacio });

  const [clases, setClases] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [clasesLoading, setClasesLoading] = useState(false);
  const [clasesError, setClasesError] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
  const [mostrarFormularioClase, setMostrarFormularioClase] = useState(false);
  const [claseForm, setClaseForm] = useState({ ...claseVacia });
  const [claseEditando, setClaseEditando] = useState(null);
  const [guardandoClase, setGuardandoClase] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setAuthError(error.message);
      setSession(data?.session ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        setResetMode(false);
        setAuthError('');
        setAuthMessage('');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void probarConexion();
  }, []);

  useEffect(() => {
    if (!session) return;

    if (active === 'alumnos') {
      void cargarAlumnos();
    }

    if (active === 'clases') {
      void cargarAlumnos();
      void cargarClases();
    }
  }, [session, active]);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setAuthError(error.message);
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage(
        'Te hemos enviado un correo para restablecer la contraseña.'
      );
    }
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (newPassword.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage('Contraseña actualizada correctamente.');
      setNewPassword('');
      setRecoveryMode(false);
      setResetMode(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
  }

  async function cargarAlumnos() {
    setAlumnosLoading(true);
    setAlumnosError('');
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .order('apellidos', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      setAlumnosError('No se pudieron cargar los alumnos: ' + error.message);
    } else {
      setAlumnos(data || []);
    }
    setAlumnosLoading(false);
  }

  async function guardarAlumno(event) {
    event.preventDefault();
    setAlumnosError('');
    const datosAlumno = {
      nombre: alumnoForm.nombre.trim(),
      apellidos: alumnoForm.apellidos.trim(),
      telefono: alumnoForm.telefono.trim(),
      email: alumnoForm.email.trim(),
      observaciones: alumnoForm.observaciones.trim(),
      activo: alumnoForm.activo,
    };

    if (!datosAlumno.nombre || !datosAlumno.apellidos) {
      setAlumnosError('El nombre y los apellidos son obligatorios.');
      return;
    }

    const result = alumnoEditando
      ? await supabase
          .from('alumnos')
          .update(datosAlumno)
          .eq('id', alumnoEditando.id)
      : await supabase.from('alumnos').insert([datosAlumno]);

    if (result.error) {
      setAlumnosError('No se pudo guardar el alumno: ' + result.error.message);
      return;
    }

    setMostrarFormularioAlumno(false);
    setAlumnoEditando(null);
    setAlumnoForm({ ...alumnoVacio });
    await cargarAlumnos();
  }

  async function cargarClases() {
    setClasesLoading(true);
    setClasesError('');

    const { data, error } = await supabase
      .from('clases_recurrentes')
      .select('*')
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      setClasesError('No se pudieron cargar las clases: ' + error.message);
      setClasesLoading(false);
      return;
    }

    setClases(data || []);

    const { data: datosInscripciones, error: errorInscripciones } =
      await supabase
        .from('clase_alumnos')
        .select('clase_id, alumno_id, alumnos(id, nombre, apellidos)')
        .eq('activo', true);

    if (errorInscripciones) {
      setClasesError(
        'Las clases se cargaron, pero no se pudieron cargar los alumnos inscritos: ' +
          errorInscripciones.message
      );
      setInscripciones([]);
    } else {
      setInscripciones(datosInscripciones || []);
    }

    setClasesLoading(false);
  }

 
  function editarClase(clase) {
    setClaseEditando(clase.id);

    setClaseForm({
      nombre: clase.nombre || '',
      profesor: clase.profesor || '',
      dia_semana: String(clase.dia_semana),
      hora_inicio: String(clase.hora_inicio).slice(0, 5),
      hora_fin: String(clase.hora_fin).slice(0, 5),
      lugar: clase.lugar || '',
      observaciones: clase.observaciones || '',
      fecha_inicio: clase.fecha_inicio || '',
      fecha_fin: clase.fecha_fin || '',
      activa: clase.activa,
    });

    setAlumnosSeleccionados(
      inscripciones
        .filter((inscripcion) => inscripcion.clase_id === clase.id)
        .map((inscripcion) => String(inscripcion.alumno_id))
    );

    setMostrarFormularioClase(true);
    setClasesError('');
  }

  async function guardarClase(event) {
    event.preventDefault();
    setClasesError('');
    setGuardandoClase(true);

    const datosClase = {
      nombre: claseForm.nombre.trim(),
      profesor: claseForm.profesor.trim(),
      dia_semana: Number(claseForm.dia_semana),
      hora_inicio: claseForm.hora_inicio,
      hora_fin: claseForm.hora_fin,
      lugar: claseForm.lugar.trim(),
      observaciones: claseForm.observaciones.trim(),
      fecha_inicio: claseForm.fecha_inicio,
      fecha_fin: claseForm.fecha_fin || null,
      activa: claseForm.activa,
    };

    if (!datosClase.nombre) {
      setClasesError('El nombre de la clase es obligatorio.');
      setGuardandoClase(false);
      return;
    }

    if (datosClase.hora_fin <= datosClase.hora_inicio) {
      setClasesError('La hora de fin debe ser posterior a la hora de inicio.');
      setGuardandoClase(false);
      return;
    }

    if (
      datosClase.fecha_fin &&
      datosClase.fecha_fin < datosClase.fecha_inicio
    ) {
      setClasesError(
        'La fecha de fin no puede ser anterior a la fecha de inicio.'
      );
      setGuardandoClase(false);
      return;
    }

    let claseId = claseEditando;

    if (claseEditando !== null) {
      const { error } = await supabase
        .from('clases_recurrentes')
        .update(datosClase)
        .eq('id', claseEditando);

      if (error) {
        setClasesError('No se pudo actualizar la clase: ' + error.message);
        setGuardandoClase(false);
        return;
      }
    } else {
      const { data: nuevaClase, error } = await supabase
        .from('clases_recurrentes')
        .insert([datosClase])
        .select('id')
        .single();

      if (error) {
        setClasesError('No se pudo guardar la clase: ' + error.message);
        setGuardandoClase(false);
        return;
      }

      claseId = nuevaClase.id;
    }

    const { error: errorBorrado } = await supabase
      .from('clase_alumnos')
      .delete()
      .eq('clase_id', claseId);

    if (errorBorrado) {
      setClasesError(
        'La clase se guardó, pero no se pudieron actualizar sus alumnos: ' +
          errorBorrado.message
      );
      setGuardandoClase(false);
      await cargarClases();
      return;
    }

    if (alumnosSeleccionados.length > 0) {
      const inscripcionesNuevas = alumnosSeleccionados.map((alumnoId) => ({
        clase_id: claseId,
        alumno_id: Number(alumnoId),
      }));

      const { error: errorInscripciones } = await supabase
        .from('clase_alumnos')
        .insert(inscripcionesNuevas);

      if (errorInscripciones) {
        setClasesError(
          'La clase se guardó, pero hubo un error al guardar los alumnos: ' +
            errorInscripciones.message
        );
        setGuardandoClase(false);
        await cargarClases();
        return;
      }
    }

    setMostrarFormularioClase(false);
    setClaseForm({ ...claseVacia });
    setAlumnosSeleccionados([]);
    setClaseEditando(null);

    await cargarClases();
    setGuardandoClase(false);
  }


  function navigate(id) {
    setActive(id);
    setMenuOpen(false);
    setAlumnosError('');
    setClasesError('');
  }

  const current = descriptions[active];

  if (authLoading) {
    return (
      <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
        Cargando ConserVan...
      </div>
    );
  }

  if (recoveryMode) {
    return (
      <div style={s.loginPage}>
        <form onSubmit={handlePasswordUpdate} style={s.loginCard}>
          <div style={s.logo}>CV</div>
          <h1 style={s.loginTitle}>Nueva contraseña</h1>
          <p style={s.loginText}>
            Introduce tu nueva contraseña para acceder a ConserVan.
          </p>
          <label style={s.loginLabel}>Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
            style={s.loginInput}
          />
          {authError && <p style={s.loginError}>{authError}</p>}
          {authMessage && <p style={s.loginSuccess}>{authMessage}</p>}
          <button type="submit" style={s.loginButton}>
            Guardar nueva contraseña
          </button>
        </form>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={s.loginPage}>
        <form
          onSubmit={resetMode ? handlePasswordReset : handleLogin}
          style={s.loginCard}
        >
          <div style={s.logo}>CV</div>
          <h1 style={s.loginTitle}>
            {resetMode ? 'Recuperar contraseña' : 'ConserVan'}
          </h1>
          <p style={s.loginText}>
            {resetMode
              ? 'Te enviaremos un enlace a tu correo electrónico.'
              : 'Accede a tu cuenta para continuar'}
          </p>
          <label style={s.loginLabel}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@email.com"
            required
            style={s.loginInput}
          />
          {!resetMode && (
            <>
              <label style={s.loginLabel}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                required
                style={s.loginInput}
              />
            </>
          )}
          {authError && <p style={s.loginError}>{authError}</p>}
          {authMessage && <p style={s.loginSuccess}>{authMessage}</p>}
          <button type="submit" style={s.loginButton}>
            {resetMode ? 'Enviar enlace' : 'Iniciar sesión'}
          </button>
          <button
            type="button"
            onClick={() => {
              setResetMode(!resetMode);
              setAuthError('');
              setAuthMessage('');
            }}
            style={s.textButton}
          >
            {resetMode
              ? 'Volver al inicio de sesión'
              : '¿Has olvidado tu contraseña?'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={s.app}>
      <aside style={{ ...s.sidebar, ...(menuOpen ? s.sidebarOpen : {}) }}>
        <div style={s.brand}>
          <div style={s.logo}>CV</div>
          <div>
            <strong style={s.brandName}>ConserVan</strong>
            <div style={s.brandCaption}>Gestión compartida</div>
          </div>
        </div>
        <div style={s.menuLabel}>MENÚ PRINCIPAL</div>
        <nav style={s.nav}>
          {sections.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              style={{
                ...s.navButton,
                ...(active === item.id ? s.navActive : {}),
              }}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <span style={s.statusDot} />
          Versión inicial
        </div>
        <button onClick={handleLogout} style={s.logoutButton}>
          Cerrar sesión
        </button>
      </aside>

      <main style={s.main}>
        <header style={s.topbar}>
          <button
            style={s.menuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir o cerrar menú"
          >
            ☰
          </button>
          <div>
            <div style={s.breadcrumb}>
              ConserVan / {sections.find((x) => x.id === active)?.label}
            </div>
            <div style={s.topTitle}>
              {active === 'inicio' ? 'Panel de inicio' : current?.title}
            </div>
          </div>
          <div style={s.avatar}>CV</div>
        </header>

        <div style={s.content}>
          {active === 'inicio' ? (
            <>
              <section style={s.hero}>
                <div style={s.heroTag}>TU ESPACIO DE ORGANIZACIÓN</div>
                <h1 style={s.heroTitle}>
                  Todo organizado,
                  <br />
                  más fácil para todos.
                </h1>
                <p style={s.heroText}>
                  Accede a las secciones de ConserVan desde un único lugar.
                </p>
              </section>
              <div style={s.sectionHeading}>
                <div>
                  <h2 style={s.heading}>Accesos directos</h2>
                  <p style={s.muted}>Selecciona una sección para continuar.</p>
                </div>
              </div>
              <div style={s.grid}>
                {sections.slice(1).map((item) => (
                  <button
                    key={item.id}
                    style={s.card}
                    onClick={() => navigate(item.id)}
                  >
                    <div style={s.cardIcon}>{item.icon}</div>
                    <strong style={s.cardTitle}>{item.label}</strong>
                    <span style={s.cardText}>Abrir sección</span>
                    <span style={s.arrow}>↗</span>
                  </button>
                ))}
              </div>
              <div style={s.notice}>
                <span style={s.noticeIcon}>i</span>
                <div>
                  <strong>Entorno de desarrollo</strong>
                  <p style={s.noticeText}>
                    Esta versión está en desarrollo. Los alumnos y las clases se
                    guardan en Supabase.
                  </p>
                </div>
              </div>
            </>
          ) : active === 'alumnos' ? (
            <section style={s.panelWide}>
              <h1 style={s.panelTitle}>Alumnos</h1>
              <p style={s.panelText}>
                Listado compartido de alumnos del grupo.
              </p>
              <button
                style={s.backButton}
                onClick={() => {
                  setAlumnoEditando(null);
                  setAlumnoForm({ ...alumnoVacio });
                  setMostrarFormularioAlumno(true);
                  setAlumnosError('');
                }}
              >
                + Añadir alumno
              </button>

              {mostrarFormularioAlumno && (
                <form onSubmit={guardarAlumno} style={s.formGrid}>
                  <input
                    style={s.field}
                    placeholder="Nombre *"
                    value={alumnoForm.nombre}
                    onChange={(e) =>
                      setAlumnoForm({ ...alumnoForm, nombre: e.target.value })
                    }
                    required
                  />
                  <input
                    style={s.field}
                    placeholder="Apellidos *"
                    value={alumnoForm.apellidos}
                    onChange={(e) =>
                      setAlumnoForm({
                        ...alumnoForm,
                        apellidos: e.target.value,
                      })
                    }
                    required
                  />
                  <input
                    style={s.field}
                    placeholder="Teléfono"
                    value={alumnoForm.telefono}
                    onChange={(e) =>
                      setAlumnoForm({ ...alumnoForm, telefono: e.target.value })
                    }
                  />
                  <input
                    style={s.field}
                    type="email"
                    placeholder="Correo electrónico"
                    value={alumnoForm.email}
                    onChange={(e) =>
                      setAlumnoForm({ ...alumnoForm, email: e.target.value })
                    }
                  />
                  <textarea
                    style={s.field}
                    placeholder="Observaciones"
                    value={alumnoForm.observaciones}
                    onChange={(e) =>
                      setAlumnoForm({
                        ...alumnoForm,
                        observaciones: e.target.value,
                      })
                    }
                  />
                  <label style={s.checkLabel}>
                    <input
                      type="checkbox"
                      checked={alumnoForm.activo}
                      onChange={(e) =>
                        setAlumnoForm({
                          ...alumnoForm,
                          activo: e.target.checked,
                        })
                      }
                    />{' '}
                    Alumno activo
                  </label>
                  {alumnosError && <p style={s.loginError}>{alumnosError}</p>}
                  <div style={s.formActions}>
                    <button type="submit" style={s.backButton}>
                      {alumnoEditando ? 'Guardar cambios' : 'Guardar alumno'}
                    </button>
                    <button
                      type="button"
                      style={s.cancelButton}
                      onClick={() => {
                        setMostrarFormularioAlumno(false);
                        setAlumnoEditando(null);
                        setAlumnosError('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {alumnosLoading && <p>Cargando alumnos...</p>}
              {alumnosError && !mostrarFormularioAlumno && (
                <p style={s.loginError}>{alumnosError}</p>
              )}
              {!alumnosLoading && !alumnosError && alumnos.length === 0 && (
                <p style={s.panelText}>Todavía no hay alumnos registrados.</p>
              )}

              {alumnos.length > 0 && (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.tableHead}>
                        <th style={s.th}>Apellidos</th>
                        <th style={s.th}>Nombre</th>
                        <th style={s.th}>Teléfono</th>
                        <th style={s.th}>Correo</th>
                        <th style={s.th}>Estado</th>
                        <th style={s.th}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.map((alumno) => (
                        <tr key={alumno.id}>
                          <td style={s.td}>{alumno.apellidos}</td>
                          <td style={s.td}>{alumno.nombre}</td>
                          <td style={s.td}>{alumno.telefono || '—'}</td>
                          <td style={s.td}>{alumno.email || '—'}</td>
                          <td style={s.td}>
                            {alumno.activo ? 'Activo' : 'Inactivo'}
                          </td>
                          <td style={s.td}>
                            <button
                              type="button"
                              style={s.smallButton}
                              onClick={() => {
                                setAlumnoEditando(alumno);
                                setAlumnoForm({
                                  nombre: alumno.nombre || '',
                                  apellidos: alumno.apellidos || '',
                                  telefono: alumno.telefono || '',
                                  email: alumno.email || '',
                                  observaciones: alumno.observaciones || '',
                                  activo: alumno.activo,
                                });
                                setMostrarFormularioAlumno(true);
                                setAlumnosError('');
                              }}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : active === 'clases' ? (
            <section style={s.panelWide}>
              <h1 style={s.panelTitle}>Clases recurrentes</h1>
              <p style={s.panelText}>
                Registra las clases que se repiten cada semana. Cada clase
                tendrá un día y un horario habitual.
              </p>
              <button
                style={s.backButton}
                onClick={() => {
                  setClaseForm({ ...claseVacia });
                  setMostrarFormularioClase(!mostrarFormularioClase);
                  setClasesError('');
                }}
              >
                {mostrarFormularioClase
                  ? 'Cerrar formulario'
                  : '+ Añadir clase recurrente'}
              </button>

              {mostrarFormularioClase && (
                <form onSubmit={guardarClase} style={s.formGrid}>
                  <input
                    style={s.field}
                    placeholder="Nombre de la clase *"
                    value={claseForm.nombre}
                    onChange={(e) =>
                      setClaseForm({ ...claseForm, nombre: e.target.value })
                    }
                    required
                  />
                  <input
                    style={s.field}
                    placeholder="Profesor"
                    value={claseForm.profesor}
                    onChange={(e) =>
                      setClaseForm({ ...claseForm, profesor: e.target.value })
                    }
                  />
                  <label style={s.fieldLabel}>
                    Día de la semana
                    <select
                      style={s.field}
                      value={claseForm.dia_semana}
                      onChange={(e) =>
                        setClaseForm({
                          ...claseForm,
                          dia_semana: e.target.value,
                        })
                      }
                    >
                      {diasSemana.map((dia) => (
                        <option key={dia.value} value={dia.value}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={s.fieldLabel}>
                    Hora de inicio
                    <input
                      style={s.field}
                      type="time"
                      value={claseForm.hora_inicio}
                      onChange={(e) =>
                        setClaseForm({
                          ...claseForm,
                          hora_inicio: e.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label style={s.fieldLabel}>
                    Hora de fin
                    <input
                      style={s.field}
                      type="time"
                      value={claseForm.hora_fin}
                      onChange={(e) =>
                        setClaseForm({ ...claseForm, hora_fin: e.target.value })
                      }
                      required
                    />
                  </label>
                  <input
                    style={s.field}
                    placeholder="Lugar"
                    value={claseForm.lugar}
                    onChange={(e) =>
                      setClaseForm({ ...claseForm, lugar: e.target.value })
                    }
                  />
                  <label style={s.fieldLabel}>
                    Fecha desde
                    <input
                      style={s.field}
                      type="date"
                      value={claseForm.fecha_inicio}
                      onChange={(e) =>
                        setClaseForm({
                          ...claseForm,
                          fecha_inicio: e.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label style={s.fieldLabel}>
                    Fecha hasta (opcional)
                    <input
                      style={s.field}
                      type="date"
                      value={claseForm.fecha_fin}
                      onChange={(e) =>
                        setClaseForm({
                          ...claseForm,
                          fecha_fin: e.target.value,
                        })
                      }
                    />
                  </label>
                  <textarea
                    style={s.field}
                    placeholder="Observaciones"
                    value={claseForm.observaciones}
                    onChange={(e) =>
                      setClaseForm({
                        ...claseForm,
                        observaciones: e.target.value,
                      })
                    }
                  />

                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: 14,
                      background: '#fff',
                      border: '1px solid #d7e0eb',
                      borderRadius: 8,
                    }}
                  >
                    <strong>Alumnos de esta clase</strong>

                    <p style={s.panelText}>
                      Marca todos los alumnos que asistirán habitualmente.
                    </p>

                    {alumnosLoading && <p>Cargando alumnos...</p>}

                    {!alumnosLoading &&
                      alumnos.filter((alumno) => alumno.activo).length ===
                        0 && (
                        <p style={s.panelText}>
                          No hay alumnos activos registrados. Añádelos primero
                          en la sección Alumnos.
                        </p>
                      )}

                    {alumnos
                      .filter((alumno) => alumno.activo)
                      .map((alumno) => (
                        <label
                          key={alumno.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 0',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={alumnosSeleccionados.includes(
                              String(alumno.id)
                            )}
                            onChange={(event) => {
                              const id = String(alumno.id);

                              setAlumnosSeleccionados((actuales) =>
                                event.target.checked
                                  ? [...actuales, id]
                                  : actuales.filter(
                                      (seleccionado) => seleccionado !== id
                                    )
                              );
                            }}
                          />
                          {alumno.apellidos}, {alumno.nombre}
                        </label>
                      ))}
                  </div>

                  <label style={s.checkLabel}>
                    <input
                      type="checkbox"
                      checked={claseForm.activa}
                      onChange={(e) =>
                        setClaseForm({ ...claseForm, activa: e.target.checked })
                      }
                    />{' '}
                    Clase activa
                  </label>
                  {clasesError && <p style={s.loginError}>{clasesError}</p>}
                  <div style={s.formActions}>
                    <button
                      type="submit"
                      style={s.backButton}
                      disabled={guardandoClase}
                    >
                      {guardandoClase ? 'Guardando...' : 'Guardar clase'}
                    </button>
                    <button
                      type="button"
                      style={s.cancelButton}
                      onClick={() => {
                        setMostrarFormularioClase(false);
                        setClasesError('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {clasesLoading && <p>Cargando clases...</p>}
              {clasesError && !mostrarFormularioClase && (
                <p style={s.loginError}>{clasesError}</p>
              )}
              {!clasesLoading && !clasesError && clases.length === 0 && (
                <p style={s.panelText}>
                  Todavía no hay clases recurrentes registradas.
                </p>
              )}
              {clases.length > 0 && (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.tableHead}>
                        <th style={s.th}>Clase</th>
                        <th style={s.th}>Profesor</th>
                        <th style={s.th}>Día</th>
                        <th style={s.th}>Horario</th>
                        <th style={s.th}>Lugar</th>
                        <th style={s.th}>Desde</th>
                        <th style={s.th}>Hasta</th>
                        <th style={s.th}>Alumnos inscritos</th>
                        <th style={s.th}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clases.map((clase) => (
                        <tr key={clase.id}>
                          <td style={s.td}>{clase.nombre}</td>
                          <td style={s.td}>{clase.profesor || '—'}</td>
                          <td style={s.td}>
                            {diasSemana.find(
                              (d) => Number(d.value) === clase.dia_semana
                            )?.label || '—'}
                          </td>
                          <td style={s.td}>
                            {String(clase.hora_inicio).slice(0, 5)} -{' '}
                            {String(clase.hora_fin).slice(0, 5)}
                          </td>
                          <td style={s.td}>{clase.lugar || '—'}</td>
                          <td style={s.td}>{clase.fecha_inicio || '—'}</td>

                          <td style={s.td}>{clase.fecha_fin || 'Sin fecha'}</td>
                          <td style={s.td}>
                            {inscripciones
                              .filter(
                                (inscripcion) =>
                                  inscripcion.clase_id === clase.id
                              )
                              .map((inscripcion) => {
                                const alumno = inscripcion.alumnos;
                                return alumno
                                  ? `${alumno.apellidos}, ${alumno.nombre}`
                                  : null;
                              })
                              .filter(Boolean)
                              .join(', ') || 'Sin alumnos inscritos'}
                          </td>
                          
                          <td style={s.td}>
                            {clase.activa ? 'Activa' : 'Inactiva'}
                          </td>
                          <td style={s.td}>
                            <button
                              type="button"
                              onClick={() => editarClase(clase)}
                              style={s.secondaryButton}
                            >
                              Editar
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            <section style={s.panel}>
              <div style={s.panelIcon}>
                {sections.find((x) => x.id === active)?.icon}
              </div>
              <h1 style={s.panelTitle}>{current?.title}</h1>
              <p style={s.panelText}>{current?.text}</p>
              <div style={s.preparedBox}>
                <strong>Contenido previsto</strong>
                {current?.items.map((item) => (
                  <div key={item} style={s.preparedItem}>
                    <span>○</span> {item}
                  </div>
                ))}
              </div>
              <p style={s.comingSoon}>
                Esta sección todavía está en preparación.
              </p>
              <button style={s.backButton} onClick={() => navigate('inicio')}>
                ← Volver al inicio
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  app: {
    minHeight: '100vh',
    background: '#f4f7fb',
    color: '#1c2b42',
    fontFamily: 'Arial, sans-serif',
  },
  sidebar: {
    position: 'fixed',
    inset: '0 auto 0 0',
    width: 250,
    background: '#142c4e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 14px',
    boxSizing: 'border-box',
    zIndex: 5,
  },
  sidebarOpen: { display: 'flex' },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '4px 8px 30px',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 13,
    background: '#3193d0',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: 17,
    color: '#fff',
  },
  brandName: { fontSize: 20 },
  brandCaption: { fontSize: 11, color: '#b5c7dc', marginTop: 4 },
  menuLabel: {
    color: '#91a9c5',
    fontSize: 10,
    letterSpacing: 1.5,
    padding: '0 10px 12px',
  },
  nav: { display: 'grid', gap: 5 },
  navButton: {
    border: 0,
    background: 'transparent',
    color: '#d3dfed',
    padding: '12px 10px',
    borderRadius: 9,
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 13,
    cursor: 'pointer',
  },
  navActive: { background: '#28527f', color: '#fff', fontWeight: 700 },
  navIcon: { width: 22, textAlign: 'center', fontSize: 19 },
  sidebarFooter: {
    marginTop: 'auto',
    padding: '20px 8px 4px',
    color: '#b5c7dc',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    background: '#60d6a4',
    borderRadius: '50%',
  },
  logoutButton: {
    display: 'block',
    width: '100%',
    marginTop: 12,
    padding: '12px 16px',
    border: '1px solid #d7e0eb',
    borderRadius: 8,
    background: '#fff',
    color: '#c62828',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  main: { marginLeft: 250, minHeight: '100vh' },
  topbar: {
    minHeight: 78,
    padding: '0 32px',
    background: '#fff',
    borderBottom: '1px solid #e5ebf2',
    display: 'flex',
    alignItems: 'center',
    gap: 15,
  },
  menuToggle: {
    display: 'none',
    border: 0,
    background: 'transparent',
    fontSize: 22,
    cursor: 'pointer',
  },
  breadcrumb: { color: '#8290a3', fontSize: 11, marginBottom: 5 },
  topTitle: { fontSize: 17, fontWeight: 700 },
  avatar: {
    marginLeft: 'auto',
    width: 37,
    height: 37,
    borderRadius: '50%',
    background: '#e1effc',
    color: '#1769aa',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 12,
  },
  content: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 30,
    boxSizing: 'border-box',
  },
  hero: {
    background: 'linear-gradient(120deg, #1769aa, #244b83)',
    color: '#fff',
    borderRadius: 18,
    padding: '34px 32px',
    marginBottom: 30,
  },
  heroTag: { fontSize: 10, letterSpacing: 2, opacity: 0.8 },
  heroTitle: { fontSize: 31, lineHeight: 1.25, margin: '16px 0 10px' },
  heroText: { fontSize: 14, lineHeight: 1.7, maxWidth: 430, opacity: 0.9 },
  sectionHeading: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },
  heading: { fontSize: 20, margin: 0 },
  muted: { color: '#738197', fontSize: 13 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 15,
  },
  card: {
    position: 'relative',
    minHeight: 145,
    textAlign: 'left',
    border: '1px solid #e4eaf2',
    background: '#fff',
    borderRadius: 14,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    cursor: 'pointer',
    color: '#1c2b42',
  },
  cardIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    display: 'grid',
    placeItems: 'center',
    background: '#e9f3fc',
    color: '#1769aa',
    fontSize: 22,
  },
  cardTitle: { fontSize: 14 },
  cardText: { fontSize: 12, color: '#8290a3' },
  arrow: { position: 'absolute', top: 18, right: 18, color: '#8290a3' },
  notice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
    background: '#eaf3fc',
    border: '1px solid #d5e8f9',
    padding: 17,
    borderRadius: 12,
    fontSize: 13,
  },
  noticeIcon: {
    width: 22,
    height: 22,
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    background: '#1769aa',
    color: '#fff',
    fontWeight: 700,
  },
  noticeText: { margin: '6px 0 0', color: '#536981', lineHeight: 1.5 },
  panel: {
    background: '#fff',
    border: '1px solid #e4eaf2',
    borderRadius: 18,
    padding: 30,
    maxWidth: 650,
  },
  panelWide: {
    background: '#fff',
    border: '1px solid #e4eaf2',
    borderRadius: 18,
    padding: 30,
    width: '100%',
    boxSizing: 'border-box',
  },
  panelIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    background: '#e9f3fc',
    color: '#1769aa',
    display: 'grid',
    placeItems: 'center',
    fontSize: 26,
  },
  panelTitle: { fontSize: 26, marginTop: 0, marginBottom: 8 },
  panelText: { color: '#64748b', lineHeight: 1.7 },
  preparedBox: {
    marginTop: 24,
    padding: 18,
    background: '#f7f9fc',
    borderRadius: 12,
    fontSize: 13,
  },
  preparedItem: {
    padding: '13px 0',
    borderBottom: '1px solid #e5ebf2',
    color: '#52647a',
  },
  comingSoon: { color: '#8290a3', fontSize: 12, lineHeight: 1.6 },
  backButton: {
    background: '#1769aa',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    padding: '11px 16px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  smallButton: {
    background: '#1769aa',
    color: '#fff',
    border: 0,
    borderRadius: 7,
    padding: '7px 10px',
    cursor: 'pointer',
  },
  cancelButton: {
    background: '#eef2f7',
    color: '#334155',
    border: 0,
    borderRadius: 8,
    padding: '11px 16px',
    cursor: 'pointer',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
    padding: 18,
    background: '#f7f9fc',
    borderRadius: 12,
  },
  field: {
    boxSizing: 'border-box',
    width: '100%',
    padding: 11,
    border: '1px solid #d7e0eb',
    borderRadius: 8,
    background: '#fff',
    font: 'inherit',
    color: '#1c2b42',
  },
  fieldLabel: { display: 'grid', gap: 7, fontSize: 12, color: '#536981' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  formActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tableWrap: { marginTop: 24, overflowX: 'auto', width: '100%' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    fontSize: 13,
    textAlign: 'left',
  },
  tableHead: { background: '#f4f7fb' },
  th: { padding: 12, whiteSpace: 'nowrap', borderBottom: '1px solid #e5ebf2' },
  td: { padding: 12, borderTop: '1px solid #e5ebf2', verticalAlign: 'top' },
  loginPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    boxSizing: 'border-box',
    background: '#f4f7fb',
    fontFamily: 'Arial, sans-serif',
  },
  loginCard: {
    width: '100%',
    maxWidth: 390,
    boxSizing: 'border-box',
    background: '#fff',
    padding: 32,
    borderRadius: 18,
    boxShadow: '0 10px 35px rgba(20, 44, 78, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  loginTitle: { color: '#142c4e', textAlign: 'center', marginBottom: 0 },
  loginText: {
    color: '#738197',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 25,
  },
  loginLabel: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 7,
    color: '#1c2b42',
  },
  loginInput: {
    boxSizing: 'border-box',
    width: '100%',
    padding: 12,
    marginBottom: 18,
    border: '1px solid #d7e0eb',
    borderRadius: 8,
    fontSize: 14,
  },
  loginButton: {
    padding: 13,
    background: '#1769aa',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
  },
  textButton: {
    marginTop: 14,
    border: 0,
    background: 'transparent',
    color: '#1769aa',
    cursor: 'pointer',
    padding: 8,
  },
  loginError: {
    color: '#c62828',
    fontSize: 13,
    overflowWrap: 'anywhere',
    gridColumn: '1 / -1',
  },
  loginSuccess: { color: '#21804a', fontSize: 13 },
};

if (
  typeof document !== 'undefined' &&
  !document.getElementById('conservan-responsive')
) {
  const mobileStyles = document.createElement('style');
  mobileStyles.id = 'conservan-responsive';
 
mobileStyles.textContent = `
    @media (max-width: 760px) {
      main { margin-left: 0 !important; }
      main > header { padding: 0 16px !important; }
      main > header > button { display: block !important; }
      main > div { padding: 18px !important; }

      aside { display: none !important; }

      aside[data-menu-open="true"] {
        display: flex !important;
        width: 250px !important;
        box-shadow: 10px 0 30px #142c4e33;
      }
    }
  `;

  document.head.appendChild(mobileStyles);
}
