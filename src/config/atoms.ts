import { atom } from 'jotai';
import type { AppConfig } from './model';

export const appConfigAtom = atom({} as AppConfig);

export const authServerHostAtom = atom((get) => get(appConfigAtom).authServerHost);
