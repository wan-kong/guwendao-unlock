/**
 * 登录绕过模块
 * 通过写入 cookie "gsw2017user" 跳过登录校验
 */
import { log } from '../utils';

const COOKIE_NAME = 'gsw2017user';
const MOCK_USER_ID = '1000001';
const MOCK_USER_TOKEN = '12345678123456781234567812345678';
const VIP_EXPIRES_AT = '2099/1/1';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function safeDecodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getCookieValues(name: string): string[] {
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.startsWith(`${name}=`))
    .map((item) => safeDecodeCookieValue(item.slice(name.length + 1)));
}

function buildLoginCookieValue(): string | undefined {
  const existingValues = getCookieValues(COOKIE_NAME);
  const realUserValue = existingValues.find((value) => {
    const [userId, token] = value.split('|');
    return Boolean(userId && token && userId !== MOCK_USER_ID);
  });

  if (realUserValue) {
    const [userId, token] = realUserValue.split('|');
    return `${userId}|${token}|${VIP_EXPIRES_AT}|${VIP_EXPIRES_AT}`;
  }

  const hasMockValue = existingValues.some((value) => value.split('|')[0] === MOCK_USER_ID);
  if (hasMockValue) {
    return undefined;
  }

  return `${MOCK_USER_ID}|${MOCK_USER_TOKEN}|${VIP_EXPIRES_AT}|${VIP_EXPIRES_AT}`;
}

function writeLoginCookie(): void {
  const cookieValue = buildLoginCookieValue();
  if (!cookieValue) return;

  const cookie = `${COOKIE_NAME}=${encodeURIComponent(cookieValue)}; path=/; max-age=${ONE_YEAR_SECONDS}`;
  document.cookie = cookie;

}

function replaceDefaultGetUserInfo(): void {
  window.getUserInfo = () => true;
}

/**
 * 写入绕过登录所需的 cookie
 */
export function bypassLogin(): void {
  replaceDefaultGetUserInfo();
  // 设置一个长期有效的 cookie，路径覆盖全站
  writeLoginCookie();
  log(`已处理 cookie: ${COOKIE_NAME}`);
}
