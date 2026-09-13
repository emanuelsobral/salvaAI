/**
 * Firebase Auth Service
 * Gerencia login, logout e estado de autenticação.
 * Suporta: Google Sign-In + Email/Senha
 */

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

/**
 * Login com Google (popup).
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Erro no login Google:', error);
    
    let msg = 'Erro desconhecido ao fazer login com Google.';
    if (error.code === 'auth/popup-closed-by-user') {
      msg = 'Login cancelado. A janela foi fechada antes de concluir.';
    } else {
      msg = error.message;
    }
    
    return { success: false, error: msg };
  }
};

/**
 * Login com Email e Senha.
 * @param {string} email 
 * @param {string} password 
 */
export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Erro no login Email:', error);
    
    // Mensagens amigáveis em PT-BR
    let msg = 'Erro desconhecido ao fazer login.';
    if (error.code === 'auth/user-not-found') msg = 'Nenhuma conta encontrada com este email.';
    if (error.code === 'auth/wrong-password') msg = 'Senha incorreta. Tente novamente.';
    if (error.code === 'auth/invalid-email') msg = 'Formato de email inválido.';
    if (error.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde alguns minutos.';
    if (error.code === 'auth/invalid-credential') msg = 'Email ou senha incorretos.';
    
    return { success: false, error: msg };
  }
};

/**
 * Criar conta com Email e Senha.
 * @param {string} email 
 * @param {string} password 
 * @param {string} displayName 
 */
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Atualiza o nome do perfil
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Erro no registro:', error);
    
    let msg = 'Erro ao criar a conta.';
    if (error.code === 'auth/email-already-in-use') msg = 'Este email já está em uso por outra conta.';
    if (error.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres.';
    if (error.code === 'auth/invalid-email') msg = 'Formato de email inválido.';
    
    return { success: false, error: msg };
  }
};

/**
 * Logout do usuário atual.
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Erro no logout:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Observa mudanças no estado de autenticação.
 * @param {function} callback - Recebe (user) ou (null)
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
