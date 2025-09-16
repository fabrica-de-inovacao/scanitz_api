/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Endpoints de autenticação e autorização
 *   - name: Users
 *     description: Gerenciamento de usuários
 *   - name: Complaints
 *     description: Gerenciamento de denúncias urbanas
 *   - name: Search
 *     description: Sistema de busca unificada
 *   - name: Dashboard
 *     description: Dashboard executivo e métricas
 *   - name: Admin
 *     description: Painel administrativo
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do usuário
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         phone:
 *           type: string
 *           description: Telefone do usuário
 *         city:
 *           type: string
 *           description: Cidade do usuário
 *         district:
 *           type: string
 *           description: Bairro do usuário
 *         verified:
 *           type: boolean
 *           description: Status de verificação do usuário
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *
 *     Complaint:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único da denúncia
 *         title:
 *           type: string
 *           description: Título da denúncia
 *         description:
 *           type: string
 *           description: Descrição detalhada
 *         user_id:
 *           type: string
 *           description: ID do usuário que criou a denúncia
 *         address:
 *           type: string
 *           description: Endereço da ocorrência
 *         city:
 *           type: string
 *           description: Cidade da ocorrência
 *         district:
 *           type: string
 *           description: Bairro da ocorrência
 *         location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               format: double
 *             longitude:
 *               type: number
 *               format: double
 *         status:
 *           type: integer
 *           enum: [0, 1, 2]
 *           description: Status da denúncia (0=Pendente, 1=Em Andamento, 2=Resolvida)
 *         image_url:
 *           type: string
 *           description: URL da imagem da denúncia
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *
 *     SearchResult:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [user, complaint]
 *           description: Tipo do resultado
 *         id:
 *           type: string
 *           description: ID do item
 *         title:
 *           type: string
 *           description: Título do resultado
 *         subtitle:
 *           type: string
 *           description: Subtítulo do resultado
 *         description:
 *           type: string
 *           description: Descrição do resultado
 *         imageUrl:
 *           type: string
 *           description: URL da imagem (se aplicável)
 *         relevanceScore:
 *           type: number
 *           description: Score de relevância da busca
 *         url:
 *           type: string
 *           description: URL para o item
 *         data:
 *           type: object
 *           description: Dados adicionais específicos do tipo
 *
 *     KPIs:
 *       type: object
 *       properties:
 *         users:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             new:
 *               type: integer
 *             active:
 *               type: integer
 *             verified:
 *               type: integer
 *             growthRate:
 *               type: object
 *         complaints:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             new:
 *               type: integer
 *             resolved:
 *               type: integer
 *             pending:
 *               type: integer
 *             inProgress:
 *               type: integer
 *             resolutionRate:
 *               type: string
 *             averageResolutionTime:
 *               type: number
 *         engagement:
 *           type: object
 *           properties:
 *             complaintsPerUser:
 *               type: string
 *             activeUsersPercentage:
 *               type: string
 *             averageComplaintsPerActiveUser:
 *               type: string
 *         quality:
 *           type: object
 *           properties:
 *             complaintsWithImages:
 *               type: integer
 *             averageDescriptionLength:
 *               type: number
 *             completenessScore:
 *               type: string
 *             duplicateRate:
 *               type: string
 */

// ==================== ENDPOINTS DE AUTENTICAÇÃO ====================

/**
 * @swagger
 * auth/login:
 *   post:
 *     summary: Login de usuário
 *     description: Autentica um usuário com email e senha, retornando um token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *                 example: "usuario@exemplo.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statuscode:
 *                   type: integer
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno no servidor
 */

/**
 * @swagger
 * auth/register:
 *   post:
 *     summary: Registro de novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - documentNumber
 *               - phoneNumber
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *               fullName:
 *                 type: string
 *                 description: Nome completo do usuário
 *               documentNumber:
 *                 type: string
 *                 description: CPF do usuário
 *               phoneNumber:
 *                 type: string
 *                 description: Número de telefone do usuário
 *     responses:
 *       201:
 *         description: Registro bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statuscode:
 *                   type: integer
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Dados inválidos ou já cadastrados
 *       500:
 *         description: Erro interno no servidor
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         uid:
 *           type: string
 *           description: ID único do usuário
 *         fullName:
 *           type: string
 *           description: Nome completo do usuário
 *         photo:
 *           type: string
 *           description: URL da foto de perfil do usuário
 *         documentNumber:
 *           type: string
 *           description: CPF do usuário
 *         phoneNumber:
 *           type: string
 *           description: Número de telefone do usuário
 *         email:
 *           type: string
 *           description: Email do usuário
 *         password:
 *           type: string
 *           description: Senha do usuário
 *     Complaint:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID da denúncia
 *         description:
 *           type: string
 *           description: Descrição da denúncia
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Data de criação da denúncia
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização da denúncia
 *         address:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *               district:
 *                 type: string
 *               fallback_name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               postal_code:
 *                 type: string
 *               state:
 *                 type: string
 *               street:
 *                 type: string
 *         situation:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: number
 *         image_url:
 *           type: string
 *           description: URL da imagem da denúncia
 *         thumbnail_url:
 *           type: string
 *           description: URL da imagem reduzida
 *         similar_count:
 *           type: number
 *           description: Número de denúncias parecidas
 *         user_id:
 *           type: string
 *           description: ID do usuário que criou a denúncia
 *         user_name:
 *           type: string
 *           description: Nome do usuário que criou a denúncia
 */

// ==================== ENDPOINTS DE USUÁRIOS AVANÇADOS ====================

/**
 * @swagger
 * users:
 *   get:
 *     summary: Listar usuários com filtros avançados
 *     description: Retorna lista paginada de usuários com opções de filtro e busca
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Itens por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca (nome, email, telefone)
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [created_at, name, email, city]
 *           default: created_at
 *         description: Campo para ordenação
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, verified, unverified]
 *           default: all
 *         description: Filtro por status de verificação
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filtrar por cidade
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: Filtrar por bairro
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Token de acesso inválido ou ausente
 */

/**
 * @swagger
 * users/statistics:
 *   get:
 *     summary: Estatísticas detalhadas dos usuários
 *     description: Retorna métricas e estatísticas completas sobre os usuários do sistema
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         verifiedUsers:
 *                           type: integer
 *                         unverifiedUsers:
 *                           type: integer
 *                         verificationRate:
 *                           type: string
 *                     growth:
 *                       type: object
 *                       properties:
 *                         last30Days:
 *                           type: integer
 *                         last7Days:
 *                           type: integer
 *                         today:
 *                           type: integer
 *                     demographics:
 *                       type: object
 *                       properties:
 *                         topCities:
 *                           type: array
 *                           items:
 *                             type: object
 *                         topDistricts:
 *                           type: array
 *                           items:
 *                             type: object
 *                     activity:
 *                       type: object
 *                       properties:
 *                         activeUsers:
 *                           type: integer
 *                         averageComplaintsPerUser:
 *                           type: string
 *                         topContributors:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         description: Token de acesso inválido ou ausente
 */

// ==================== ENDPOINTS DE COMPLAINTS AVANÇADOS ====================

/**
 * @swagger
 * complaints/proximity:
 *   get:
 *     summary: Busca denúncias por proximidade geográfica
 *     description: Encontra denúncias próximas a uma localização específica
 *     tags: [Complaints]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: Latitude da localização de referência
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: Longitude da localização de referência
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 1
 *         description: Raio de busca em quilômetros
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de resultados
 *     responses:
 *       200:
 *         description: Denúncias próximas encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Complaint'
 *                       - type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                             description: Distância em quilômetros
 *                 meta:
 *                   type: object
 *                   properties:
 *                     center:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     radius:
 *                       type: number
 *                     totalFound:
 *                       type: integer
 */

/**
 * @swagger
 * complaints/analytics:
 *   get:
 *     summary: Analytics avançados de denúncias
 *     description: Retorna análises estatísticas detalhadas sobre as denúncias
 *     tags: [Complaints]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período de análise
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, city, district, status]
 *           default: day
 *         description: Agrupamento dos dados
 *     responses:
 *       200:
 *         description: Analytics retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                     trends:
 *                       type: object
 *                     geographical:
 *                       type: object
 *                     performance:
 *                       type: object
 *                     predictions:
 *                       type: object
 */

// ==================== SISTEMA DE BUSCA UNIFICADA ====================

/**
 * @swagger
 * search:
 *   get:
 *     summary: Busca unificada no sistema
 *     description: Realiza busca inteligente em usuários e denúncias com relevância, facetas e sugestões
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *         example: "buraco rua"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, users, complaints]
 *           default: all
 *         description: Tipo de conteúdo para buscar
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Itens por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, date, title]
 *           default: relevance
 *         description: Critério de ordenação
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: Filtros em formato JSON
 *     responses:
 *       200:
 *         description: Resultados da busca retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SearchResult'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         users:
 *                           type: integer
 *                         complaints:
 *                           type: integer
 *                         searchTime:
 *                           type: number
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     facets:
 *                       type: object
 *                     query:
 *                       type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * search/autocomplete:
 *   get:
 *     summary: Sugestões de autocompletar
 *     description: Retorna sugestões em tempo real para autocompletar a busca
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Termo parcial para autocompletar
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, users, complaints]
 *           default: all
 *         description: Tipo de conteúdo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *           maximum: 15
 *         description: Número máximo de sugestões
 *     responses:
 *       200:
 *         description: Sugestões retornadas com sucesso
 */

// ==================== DASHBOARD EXECUTIVO ====================

/**
 * @swagger
 * dashboard:
 *   get:
 *     summary: Dashboard principal com KPIs
 *     description: Retorna métricas principais e KPIs do sistema em tempo real
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período para análise dos KPIs
 *     responses:
 *       200:
 *         description: KPIs retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     kpis:
 *                       $ref: '#/components/schemas/KPIs'
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: object
 *                           properties:
 *                             change:
 *                               type: string
 *                               example: "+15%"
 *                             trend:
 *                               type: string
 *                               enum: [up, down, stable]
 *                         complaints:
 *                           type: object
 *                         resolution:
 *                           type: object
 *                     details:
 *                       type: object
 *                       nullable: true
 *                     meta:
 *                       type: object
 *                       properties:
 *                         timeframe:
 *                           type: string
 *                         period:
 *                           type: string
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                         dataFreshness:
 *                           type: string
 */

/**
 * @swagger
 * dashboard/executive-report:
 *   get:
 *     summary: Relatório executivo completo
 *     description: Gera relatório executivo detalhado com insights e recomendações
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, quarterly, yearly]
 *           default: monthly
 *         description: Período do relatório
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, summary]
 *           default: json
 *         description: Formato do relatório
 *     responses:
 *       200:
 *         description: Relatório executivo gerado com sucesso
 */

/**
 * @swagger
 * dashboard/realtime-kpis:
 *   get:
 *     summary: KPIs em tempo real
 *     description: Retorna métricas atualizadas em tempo real com alertas
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: KPIs em tempo real retornados com sucesso
 */

// ==================== PAINEL ADMINISTRATIVO ====================

/**
 * @swagger
 * admin:
 *   get:
 *     summary: Informações do painel administrativo
 *     description: Retorna informações gerais sobre o painel administrativo e seus endpoints
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Informações do painel retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     version:
 *                       type: string
 *                     endpoints:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: string
 *                         complaints:
 *                           type: string
 *                         moderation:
 *                           type: string
 *                         audit:
 *                           type: string
 *                         system:
 *                           type: string
 *                     features:
 *                       type: array
 *                       items:
 *                         type: string
 */

/**
 * @swagger
 * admin/users:
 *   get:
 *     summary: Gerenciamento administrativo de usuários
 *     description: Lista usuários com filtros administrativos e ferramentas de moderação
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, verified, unverified, active, inactive]
 *           default: all
 *         description: Filtro por status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, admin, moderator, user]
 *           default: all
 *         description: Filtro por função
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, email ou ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, last_activity, complaints_count, name]
 *           default: created_at
 *         description: Critério de ordenação
 *     responses:
 *       200:
 *         description: Lista administrativa de usuários
 *       401:
 *         description: Acesso negado - privilégios administrativos necessários
 */

/**
 * @swagger
 * admin/complaints:
 *   get:
 *     summary: Moderação administrativa de denúncias
 *     description: Interface administrativa para moderação e gestão de denúncias
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, approved, rejected, flagged]
 *           default: all
 *         description: Status de moderação
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [all, high, medium, low]
 *           default: all
 *         description: Nível de prioridade
 *     responses:
 *       200:
 *         description: Lista de denúncias para moderação
 */

/**
 * @swagger
 * admin/audit:
 *   get:
 *     summary: Log de auditoria do sistema
 *     description: Visualiza logs de auditoria e atividades administrativas
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Itens por página
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [all, create, update, delete, login, logout, moderate]
 *           default: all
 *         description: Tipo de ação
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtrar por usuário específico
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *     responses:
 *       200:
 *         description: Logs de auditoria retornados com sucesso
 */

/**
 * @swagger
 * admin/system:
 *   get:
 *     summary: Informações do sistema
 *     description: Retorna informações técnicas e de saúde do sistema
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Informações do sistema retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, warning, critical]
 *                         uptime:
 *                           type: number
 *                         memory:
 *                           type: object
 *                         database:
 *                           type: object
 *                         services:
 *                           type: object
 *                     version:
 *                       type: object
 *                       properties:
 *                         api:
 *                           type: string
 *                         database:
 *                           type: string
 *                         lastDeploy:
 *                           type: string
 *                           format: date-time
 *                     configuration:
 *                       type: object
 *                       properties:
 *                         environment:
 *                           type: string
 *                         features:
 *                           type: array
 *                         limits:
 *                           type: object
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         requestsPerMinute:
 *                           type: number
 *                         activeConnections:
 *                           type: integer
 *                         errorRate:
 *                           type: number
 */

/**
 * @swagger
 * complaints/heatmap:
 *   get:
 *     summary: Dados otimizados para mapa de calor
 *     description: Retorna dados estruturados para geração de mapas de calor incluindo clustering, estatísticas e metadados
 *     tags:
 *       - Complaints
 *     parameters:
 *       - in: query
 *         name: bounds
 *         schema:
 *           type: object
 *           properties:
 *             north:
 *               type: number
 *               format: float
 *             south:
 *               type: number
 *               format: float
 *             east:
 *               type: number
 *               format: float
 *             west:
 *               type: number
 *               format: float
 *         description: Bounds geográficos para filtrar denúncias
 *       - in: query
 *         name: zoom
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 15
 *           default: 10
 *         description: Nível de zoom para clustering (1-15)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, progress, resolved]
 *           default: "all"
 *         description: Filtrar por status da denúncia
 *     responses:
 *       200:
 *         description: Dados estruturados para mapa de calor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statuscode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     points:
 *                       type: array
 *                       description: Pontos individuais para zoom alto
 *                       items:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             format: float
 *                           lng:
 *                             type: number
 *                             format: float
 *                           weight:
 *                             type: integer
 *                             description: Peso do ponto (1-3, baseado no status)
 *                           status:
 *                             type: integer
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           district:
 *                             type: string
 *                     clusters:
 *                       type: array
 *                       description: Clusters para zoom baixo
 *                       items:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             format: float
 *                           lng:
 *                             type: number
 *                             format: float
 *                           count:
 *                             type: integer
 *                           status_breakdown:
 *                             type: object
 *                             properties:
 *                               pending:
 *                                 type: integer
 *                               progress:
 *                                 type: integer
 *                               resolved:
 *                                 type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         byStatus:
 *                           type: object
 *                           properties:
 *                             pending:
 *                               type: integer
 *                             progress:
 *                               type: integer
 *                             resolved:
 *                               type: integer
 *                         byDistrict:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               district:
 *                                 type: string
 *                               total:
 *                                 type: integer
 *                               pending:
 *                                 type: integer
 *                               progress:
 *                                 type: integer
 *                               resolved:
 *                                 type: integer
 *                         center:
 *                           type: object
 *                           properties:
 *                             lat:
 *                               type: number
 *                               format: float
 *                             lng:
 *                               type: number
 *                               format: float
 *                         bounds:
 *                           type: object
 *                           properties:
 *                             north:
 *                               type: number
 *                               format: float
 *                             south:
 *                               type: number
 *                               format: float
 *                             east:
 *                               type: number
 *                               format: float
 *                             west:
 *                               type: number
 *                               format: float
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                     zoom_level:
 *                       type: integer
 *                     filtered_by:
 *                       type: string
 *                       nullable: true
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
