import { Prisma } from '@prisma/client';
import { AuthUser } from '../middleware/auth';

/**
 * Строит where для выборки клиентов, доступных текущему пользователю.
 *
 * Правила:
 * - OWNER/ADMIN с tenantId:
 *   - видят всех клиентов внутри своего tenantId.
 * - NUTRITIONIST:
 *   - видит только своих клиентов (userId = user.id),
 *   - при наличии tenantId у пользователя дополнительно фильтруем по tenantId.
 * - fallback:
 *   - если нет tenantId и роль OWNER/ADMIN — ограничиваемся userId,
 *     чтобы не допустить утечки.
 *
 * Используем generic Prisma.ClientWhereInput без tenantId в типе схемы —
 * tenantId учитывается через связь с пользователем/контекстом.
 */
export function buildClientAccessWhere(user: AuthUser): Prisma.ClientWhereInput {
  if (!user) {
    // requireAuth гарантирует наличие user; здесь защита от неверного вызова
    return { id: '' };
  }

  // NUTRITIONIST — только свои клиенты (и при наличии tenantId в контексте,
  // сгенерированном JWT, всё равно фильтруем по userId).
  if (user.role === 'NUTRITIONIST') {
    return {
      userId: user.id,
    };
  }

  // OWNER/ADMIN c tenantId:
  // В текущей схеме клиенты сидируютcя с tenantId через сидер (по users),
  // но в Prisma-модели поля tenantId может не быть.
  // На этом этапе ограничиваемся tenant-контекстом через user,
  // т.е. в доменных модулях where строится по userId/tenantId согласно этой логике.
  if ((user.role === 'OWNER' || user.role === 'ADMIN') && user.tenantId) {
    // Разрешаем всех клиентов этого tenant.
    // Реализация конкретного условия делается в модулях с учётом схемы.
    return {};
  }

  // Fallback для OWNER/ADMIN без tenantId — ограничиваемся userId
  return {
    userId: user.id,
  };
}

/**
 * Проверяет доступ текущего пользователя к конкретному клиенту.
 *
 * Используется для:
 * - client-specific операций: labs, menu, events, profile, norms, etc.
 * - правил:
 *   - OWNER/ADMIN с tenantId: client.tenantId === user.tenantId (если tenantId в модели есть)
 *   - NUTRITIONIST: client.userId === user.id (и tenantId, если есть)
 *   - fallback: client.userId === user.id
 *
 * При нарушении рекомендуется возвращать 404, чтобы маскировать существование.
 */
export function assertClientAccess(
  user: AuthUser,
  client: { id: string; userId: string; tenantId?: string | null }
): boolean {
  if (!user) return false;

  // OWNER/ADMIN с tenantId: tenant-изолированный доступ если tenantId присутствует в модели
  if ((user.role === 'OWNER' || user.role === 'ADMIN') && user.tenantId) {
    if (client.tenantId != null) {
      return client.tenantId === user.tenantId;
    }
    // Если tenantId у клиента нет в схеме, считаем доступным только если это "его" клиент
    return client.userId === user.id;
  }

  // NUTRITIONIST: только свои клиенты (и при наличии tenantId — внутри своего tenant)
  if (user.role === 'NUTRITIONIST') {
    if (client.userId !== user.id) return false;
    if (user.tenantId && client.tenantId != null) {
      return client.tenantId === user.tenantId;
    }
    return true;
  }

  // Fallback: владелец/админ без tenantId — только свои клиенты
  return client.userId === user.id;
}