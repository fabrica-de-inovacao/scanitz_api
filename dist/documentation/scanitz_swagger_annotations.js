/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticação
 */
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de usuário
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
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
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
 * /auth/register:
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
