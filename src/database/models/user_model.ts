/**
 * Interface baseada na estrutura REAL do Firestore Collection "users"
 * Localização: nam5 (North America 5)
 */
export interface UserModel {
  // Campos obrigatórios presentes no banco
  documentNumber: string; // CPF no formato "012.928.133-69"
  email: string; // Email do usuário
  fullName: string; // Nome completo
  phoneNumber: string; // Telefone formato "99 99140-9572"

  // Campos opcionais (podem existir via Firebase Auth)
  uid?: string; // Firebase Auth UID
  photoURL?: string; // URL da foto de perfil
  verified?: boolean; // Status de verificação
  created_at?: Date; // Data de criação
  updated_at?: Date; // Última atualização
}
