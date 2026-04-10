import React, { createContext, useContext, useReducer, type Dispatch } from 'react'
import type { Company, CompanyEmployee, Ride, Driver } from '@/types'

// --- Auth State ---
interface AuthState {
  company: Company | null
  user: CompanyEmployee | null
  isAuthenticated: boolean
}

type AuthAction =
  | { type: 'LOGIN'; company: Company; user: CompanyEmployee }
  | { type: 'LOGOUT' }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { company: action.company, user: action.user, isAuthenticated: true }
    case 'LOGOUT':
      return { company: null, user: null, isAuthenticated: false }
    default:
      return state
  }
}

// --- UI State ---
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface UIState {
  toasts: Toast[]
  sidebarOpen: boolean
}

type UIAction =
  | { type: 'ADD_TOAST'; toast: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'TOGGLE_SIDEBAR' }

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { ...action.toast, id: Date.now().toString() }] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    default:
      return state
  }
}

// --- Fleet State ---
interface FleetState {
  driverPositions: Record<string, { lat: number; lng: number; heading: number; speed: number; timestamp: string }>
  activeRides: Ride[]
  drivers: Driver[]
}

type FleetAction =
  | { type: 'UPDATE_POSITIONS'; positions: FleetState['driverPositions'] }
  | { type: 'SET_ACTIVE_RIDES'; rides: Ride[] }
  | { type: 'SET_DRIVERS'; drivers: Driver[] }

function fleetReducer(state: FleetState, action: FleetAction): FleetState {
  switch (action.type) {
    case 'UPDATE_POSITIONS':
      return { ...state, driverPositions: action.positions }
    case 'SET_ACTIVE_RIDES':
      return { ...state, activeRides: action.rides }
    case 'SET_DRIVERS':
      return { ...state, drivers: action.drivers }
    default:
      return state
  }
}

// --- Combined State & Context ---
interface AppState {
  auth: AuthState
  ui: UIState
  fleet: FleetState
}

type AppAction = AuthAction | UIAction | FleetAction

function appReducer(state: AppState, action: AppAction): AppState {
  return {
    auth: authReducer(state.auth, action as AuthAction),
    ui: uiReducer(state.ui, action as UIAction),
    fleet: fleetReducer(state.fleet, action as FleetAction),
  }
}

const initialState: AppState = {
  auth: { company: null, user: null, isAuthenticated: false },
  ui: { toasts: [], sidebarOpen: true },
  fleet: { driverPositions: {}, activeRides: [], drivers: [] },
}

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext deve essere usato dentro AppProvider')
  return ctx
}

// Typed helpers
export function useAuth() {
  const { state, dispatch } = useAppContext()
  return {
    ...state.auth,
    login: (company: Company, user: CompanyEmployee) => dispatch({ type: 'LOGIN', company, user }),
    logout: () => dispatch({ type: 'LOGOUT' }),
  }
}

export function useToasts() {
  const { state, dispatch } = useAppContext()
  return {
    toasts: state.ui.toasts,
    addToast: (toast: Omit<Toast, 'id'>) => dispatch({ type: 'ADD_TOAST', toast }),
    removeToast: (id: string) => dispatch({ type: 'REMOVE_TOAST', id }),
    success: (message: string) => dispatch({ type: 'ADD_TOAST', toast: { type: 'success', message } }),
    error: (message: string) => dispatch({ type: 'ADD_TOAST', toast: { type: 'error', message } }),
    warning: (message: string) => dispatch({ type: 'ADD_TOAST', toast: { type: 'warning', message } }),
  }
}

export function useFleetStore() {
  const { state, dispatch } = useAppContext()
  return {
    ...state.fleet,
    updatePositions: (positions: FleetState['driverPositions']) => dispatch({ type: 'UPDATE_POSITIONS', positions }),
    setActiveRides: (rides: Ride[]) => dispatch({ type: 'SET_ACTIVE_RIDES', rides }),
    setDrivers: (drivers: Driver[]) => dispatch({ type: 'SET_DRIVERS', drivers }),
  }
}
