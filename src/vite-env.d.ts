/// <reference types="vite/client" />

declare namespace React {
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  export interface ReactNode {
    children?: ReactNode | undefined;
  }

  export type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<P, any>);
  export type Key = string | number;

  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P, context?: any): ReactElement<any, any> | null;
    displayName?: string;
  }

  export abstract class Component<P, S> {
    constructor(props: P, context?: any);
    setState(state: S, callback?: () => void): void;
    forceUpdate(callback?: () => void): void;
    render(): ReactElement | null;
    props: Readonly<P>;
    state: Readonly<S>;
    context: any;
  }

  export type CSSProperties = any;
  export type RefObject<T> = { current: T | null };
  export type Ref<T> = RefObject<T> | ((instance: T | null) => void) | null;
  export type LegacyRef<T> = string | Ref<T>;

  export interface SVGProps<T> extends HTMLAttributes<T> {
    className?: string;
    color?: string;
    height?: number | string;
    id?: string;
    lang?: string;
    max?: number | string;
    media?: string;
    method?: string;
    min?: number | string;
    name?: string;
    style?: CSSProperties;
    target?: string;
    type?: string;
    width?: number | string;
    size?: number | string;
    onClick?: (event: any) => void;
  }

  export interface HTMLAttributes<T> {
    className?: string;
    dangerouslySetInnerHTML?: { __html: string };
    dir?: string;
    hidden?: boolean;
    id?: string;
    lang?: string;
    style?: CSSProperties;
    tabIndex?: number;
    title?: string;
    onClick?: (event: any) => void;
  }

  export interface FormEvent<T = Element> extends SyntheticEvent<T> {
    target: EventTarget & T;
  }

  export interface SyntheticEvent<T = Element, E = Event> {
    bubbles: boolean;
    cancelable: boolean;
    currentTarget: EventTarget & T;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    nativeEvent: E;
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget;
    timeStamp: number;
    type: string;
  }

  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: EventTarget & T;
  }

  export interface EventTarget {
    value?: string;
  }

  export const Fragment: unique symbol;
}

declare module 'react' {
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function useRef<T>(initialValue: T): React.RefObject<T>;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>): T;
  export function useMemo<T>(factory: () => T, deps: ReadonlyArray<any> | undefined): T;

  export function createContext<T>(defaultValue: T): React.Context<T>;
  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }
  export interface Provider<T> {
    value: T;
  }
  export interface Consumer<T> {
    children: (value: T) => React.ReactNode;
  }

  export const Fragment: unique symbol;
}

declare module 'react-dom' {
  import * as ReactDOM from 'react-dom';
  export = ReactDOM;
  export as namespace ReactDOM;
  
  export function createRoot(container: Element | Document | DocumentFragment | null): {
    render(element: React.ReactElement): void;
    unmount(): void;
  };
}

declare module 'react-router-dom' {
  export interface LinkProps {
    to: string;
    replace?: boolean;
    state?: any;
    className?: string;
    children?: React.ReactNode;
    onClick?: () => void;
  }
  
  export const Link: React.FC<LinkProps>;
  export const useParams: <T extends Record<string, string>>() => T;
  export const useNavigate: () => (path: string) => void;
  export const useLocation: () => { pathname: string; search: string; hash: string; state: any };
  export const BrowserRouter: React.FC<{ children: React.ReactNode }>;
  export const Routes: React.FC<{ children: React.ReactNode }>;
  export const Route: React.FC<{ path: string; element: React.ReactElement }>;
}

declare module 'lucide-react' {
  export const Calendar: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ChartBar: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ListOrdered: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Loader: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Squircle: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Trophy: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Users: React.FC<React.SVGProps<SVGSVGElement>>;
  export const CircleAlert: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Check: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ChevronDown: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ChevronRight: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Clock: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Filter: React.FC<React.SVGProps<SVGSVGElement>>;
  export const MapPin: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Play: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Plus: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Search: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Shield: React.FC<React.SVGProps<SVGSVGElement>>;
  export const X: React.FC<React.SVGProps<SVGSVGElement>>;
  export const ArrowLeft: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Pencil: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Save: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Trash2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const User: React.FC<React.SVGProps<SVGSVGElement>>;
  export const UserPlus: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Award: React.FC<React.SVGProps<SVGSVGElement>>;
  export const TrendingUp: React.FC<React.SVGProps<SVGSVGElement>>;
  export const UserCheck: React.FC<React.SVGProps<SVGSVGElement>>;
  export const Menu: React.FC<React.SVGProps<SVGSVGElement>>;
}
