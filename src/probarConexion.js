import { supabase } from './supabase';

export async function probarConexion() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Conexión con Supabase correcta');
  console.log('¿Hay una sesión activa?', !!data.session);
}
