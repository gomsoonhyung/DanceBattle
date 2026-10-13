/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 고를 수 있는 캐릭터 id (쉼표로 구분). 비우면 전체. 배포 설정 .env.release 에서 정한다 */
  readonly VITE_ROSTER?: string;
}
