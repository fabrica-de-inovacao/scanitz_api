import { Request, Response, NextFunction } from "express";
import {
  verifyFirebaseToken,
  getFirebaseUser,
} from "../config/firebase-admin-init";

// Extender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        email_verified?: boolean;
      };
    }
  }
}

/**
 * Middleware de autenticação Firebase
 * Verifica o token JWT do Firebase no header Authorization
 */
export const authenticateFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        statuscode: 401,
        message: "Token de acesso requerido. Formato: Bearer <token>",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        statuscode: 401,
        message: "Token não fornecido",
      });
    }

    // Verificar token com Firebase Admin
    const decodedToken = await verifyFirebaseToken(token);

    // Adicionar dados do usuário na request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);

    // Diferentes tipos de erro
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        statuscode: 401,
        message: "Token expirado. Faça login novamente.",
        errorCode: "TOKEN_EXPIRED",
      });
    }

    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({
        success: false,
        statuscode: 401,
        message: "Token revogado. Faça login novamente.",
        errorCode: "TOKEN_REVOKED",
      });
    }

    return res.status(401).json({
      success: false,
      statuscode: 401,
      message: "Token inválido",
      errorCode: "INVALID_TOKEN",
    });
  }
};

/**
 * Middleware opcional - permite acesso com ou sem autenticação
 * Útil para endpoints que funcionam melhor com usuário logado mas não exigem
 */
export const optionalAuthentication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token) {
        try {
          const decodedToken = await verifyFirebaseToken(token);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            email_verified: decodedToken.email_verified,
          };
        } catch (error) {
          // Se token inválido, continua sem usuário
          console.warn("Token inválido no middleware opcional:", error.message);
        }
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, continua sem usuário
    next();
  }
};

/**
 * Middleware para verificar se usuário tem email verificado
 */
export const requireEmailVerified = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      statuscode: 401,
      message: "Usuário não autenticado",
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      statuscode: 403,
      message: "Email não verificado. Verifique seu email antes de continuar.",
      errorCode: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário logado é o dono do recurso
 */
export const requireOwnership = (paramName: string = "uid") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statuscode: 401,
        message: "Usuário não autenticado",
      });
    }

    const resourceUid = req.params[paramName];

    if (req.user.uid !== resourceUid) {
      return res.status(403).json({
        success: false,
        statuscode: 403,
        message: "Acesso negado. Você só pode acessar seus próprios dados.",
        errorCode: "ACCESS_DENIED",
      });
    }

    next();
  };
};

export default {
  authenticateFirebaseToken,
  optionalAuthentication,
  requireEmailVerified,
  requireOwnership,
};
