/**
 * Interface baseada na estrutura REAL do Firestore Collection "complaints"
 * Localização: nam5 (North America 5)
 */
export interface ComplaintsModel {
  // ID do documento (gerado pelo Firestore)
  id?: string;

  // Conteúdo da denúncia
  description: string; // Texto da denúncia

  // Localização (objeto, não array)
  address: {
    city: string; // "Imperatriz"
    district: string; // "Parque Sanharol"
    fallbackName: string; // Nome alternativo do local
    latitude: number; // Coordenada GPS
    longitude: number; // Coordenada GPS
    postalCode: string; // CEP formato "65914-408"
    state: string; // "Maranhão"
  };

  // Status (objeto, não array)
  situation: {
    status: number; // 0=pendente, 1=progresso, 2=resolvido
  };

  // Mídia
  imageUrl: string; // URL da imagem original
  thumbnailUrl: string; // URL da thumbnail otimizada

  // Métricas
  similarCount: number; // Quantidade de denúncias similares

  // Dados do usuário
  userId: string; // Firebase Auth UID do criador
  userName: string; // Nome do usuário (desnormalizado)

  // Timestamps (Firebase Timestamp)
  createdAt: any; // Timestamp de criação
  updatedAt: any; // Timestamp da última atualização
}
