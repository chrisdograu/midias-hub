// Web Social — redireciona para a Biblioteca Social (a "casa pessoal").
// O feed de timeline tipo Instagram foi descontinuado: o Web é Profundidade e Memória,
// não Descoberta. Descoberta vive no Mobile.
import { Navigate } from 'react-router-dom';

export default function Social() {
  return <Navigate to="/social" replace />;
}
