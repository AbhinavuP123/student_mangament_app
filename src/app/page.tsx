"use client";
import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Building2, 
  LogOut, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Menu,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye, 
  ArrowLeft 
} from 'lucide-react';

/**
 * ==========================================
 * TYPES & INTERFACES
 * ==========================================
 */

type UserRole = 'admin' | 'user';
type AuthPageState = 'login' | 'register';
type AppView = 'dashboard' | 'departments' | 'students' | 'teachers' | 'teacherDetails'; 

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  enrollmentDate: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  specialization: string;
}

/**
 * ==========================================
 * MOCK API SERVICE (In-Memory Database)
 * ==========================================
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const mockDb = {
  // Initial Department Data
  departments: [
    { id: 'dept-1', name: 'Computer Science', code: 'CS', description: 'Software and Hardware engineering' },
    { id: 'dept-2', name: 'Mathematics', code: 'MATH', description: 'Pure and Applied Mathematics' },
    { id: 'dept-3', name: 'Physics', code: 'PHY', description: 'Study of matter and energy' },
  ] as Department[],
  // Initial Student Data: IDs updated to be more descriptive (e.g., student-CS-001)
  students: [
    { id: 'student-CS-001', firstName: 'Alice', lastName: 'Smith', email: 'alice@school.edu', departmentId: 'dept-1', enrollmentDate: '2023-09-01' },
    { id: 'student-MATH-001', firstName: 'Bob', lastName: 'Johnson', email: 'bob@school.edu', departmentId: 'dept-2', enrollmentDate: '2023-09-01' },
    { id: 'student-CS-002', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@school.edu', departmentId: 'dept-1', enrollmentDate: '2023-09-15' },
    { id: 'student-PHY-001', firstName: 'Diana', lastName: 'Prince', email: 'diana@school.edu', departmentId: 'dept-3', enrollmentDate: '2024-01-20' },
  ] as Student[],
  // Initial Teacher Data
  teachers: [
    { id: 'teacher-CS-001', firstName: 'Dr. Emily', lastName: 'Brown', email: 'emily@school.edu', departmentId: 'dept-1', specialization: 'AI' },
    { id: 'teacher-MATH-001', firstName: 'Prof. Alan', lastName: 'Davis', email: 'alan@school.edu', departmentId: 'dept-2', specialization: 'Calculus' },
    { id: 'teacher-PHY-001', firstName: 'Dr. John', lastName: 'Doe', email: 'john@school.edu', departmentId: 'dept-3', specialization: 'Quantum Mechanics' },
  ] as Teacher[],
  // Mock user storage for registration and login
  users: [
    { id: 'u1', name: 'Admin User', email: 'admin@school.edu', password: 'password', role: 'admin' },
  ] as (User & { password: string })[]
};

const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(500);
      const userRecord = mockDb.users.find(u => u.email === email && u.password === password);
      if (userRecord) {
        // Return user without password
        const { password: _, ...user } = userRecord;
        return user;
      }
      throw new Error('Invalid credentials');
    },
    register: async (name: string, email: string, password: string): Promise<User> => {
      await delay(500);
      if (mockDb.users.some(u => u.email === email)) {
        throw new Error('User already exists');
      }
      const newUserRecord = { 
        id: generateId(), 
        name, 
        email, 
        password, 
        role: 'user' as UserRole 
      };
      mockDb.users.push(newUserRecord);
      
      const { password: _, ...user } = newUserRecord;
      return user;
    }
  },
  departments: {
    // GET /api/departments
    getAll: async () => { await delay(300); return [...mockDb.departments]; },
    getById: async (id: string) => { 
        await delay(300);
        const dept = mockDb.departments.find(d => d.id === id);
        if (!dept) throw new Error('Department not found');
        return dept;
    },
    // POST /api/departments
    create: async (data: Omit<Department, 'id'>) => {
      await delay(300);
      const newDept = { ...data, id: generateId() };
      mockDb.departments.push(newDept);
      return newDept;
    },
    // PUT /api/departments/:id
    update: async (id: string, data: Partial<Department>) => {
      await delay(300);
      const idx = mockDb.departments.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Department not found');
      mockDb.departments[idx] = { ...mockDb.departments[idx], ...data };
      return mockDb.departments[idx];
    },
    // DELETE /api/departments/:id
    delete: async (id: string) => {
      await delay(300);
      mockDb.departments = mockDb.departments.filter(d => d.id !== id);
      return true;
    }
  },
  students: {
    getAll: async (deptId?: string) => { 
      await delay(300); 
      return deptId 
        ? mockDb.students.filter(s => s.departmentId === deptId)
        : [...mockDb.students]; 
    },
    // GET /api/students/:id
    getById: async (id: string): Promise<Student> => {
      await delay(300);
      const student = mockDb.students.find(s => s.id === id);
      if (!student) {
        throw new Error(`Student with ID ${id} not found`);
      }
      return student;
    },
    // POST /api/students
    create: async (data: Omit<Student, 'id'>) => {
      await delay(300);
      // Logic for new ID generation could be added here, e.g., 'student-new-001'
      const newStudent = { ...data, id: generateId(), enrollmentDate: new Date().toISOString().split('T')[0] }; 
      mockDb.students.push(newStudent);
      return newStudent;
    },
    // PUT /api/students/:id
    update: async (id: string, data: Partial<Student>) => {
      await delay(300);
      const idx = mockDb.students.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Not found');
      mockDb.students[idx] = { ...mockDb.students[idx], ...data };
      return mockDb.students[idx];
    },
    // DELETE /api/students/:id
    delete: async (id: string) => {
      await delay(300);
      mockDb.students = mockDb.students.filter(s => s.id !== id);
      return true;
    }
  },
  teachers: {
    getAll: async (deptId?: string) => { 
      await delay(300); 
      return deptId 
        ? mockDb.teachers.filter(t => t.departmentId === deptId)
        : [...mockDb.teachers]; 
    },
    // GET /api/teachers/:id
    getById: async (id: string): Promise<Teacher> => {
      await delay(300);
      const teacher = mockDb.teachers.find(t => t.id === id);
      if (!teacher) {
        throw new Error(`Teacher with ID ${id} not found`);
      }
      return teacher;
    },
    create: async (data: Omit<Teacher, 'id'>) => {
      await delay(300);
      const newTeacher = { ...data, id: generateId() };
      mockDb.teachers.push(newTeacher);
      return newTeacher;
    },
    update: async (id: string, data: Partial<Teacher>) => {
      await delay(300);
      const idx = mockDb.teachers.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Not found');
      mockDb.teachers[idx] = { ...mockDb.teachers[idx], ...data };
      return mockDb.teachers[idx];
    },
    delete: async (id: string) => {
      await delay(300);
      mockDb.teachers = mockDb.teachers.filter(t => t.id !== id);
      return true;
    }
  }
};

/**
 * ==========================================
 * UI COMPONENTS (Replicating ShadCN)
 * ==========================================
 */

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link', size?: 'default' | 'sm' | 'icon' | 'lg' }>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
      destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
      outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
      link: "text-slate-900 underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = '', ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    />
  )
);
Label.displayName = "Label";

const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardContent = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

// Simplified Select for single-file (Native Select with custom styling)
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none ${className}`}
        {...props}
      />
      <div className="absolute right-3 top-3 pointer-events-none opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  )
);
Select.displayName = "Select";

// Modal Component
const Dialog = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
        </div>
        {children}
        <button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Toast Notification context
interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error';
}

const ToastContext = createContext<{ showToast: (msg: string, type: 'success' | 'error') => void }>({ showToast: () => {} });

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now();
        const newToast: ToastMessage = { id, message, type };
        setToasts(prev => [...prev, newToast]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000); // 5 seconds duration
    };

    const Toast = ({ message, type, id }: ToastMessage) => (
        <div className={`p-4 rounded-md shadow-lg mb-2 flex items-center justify-between text-sm transition-all duration-300 transform translate-x-0 opacity-100 ${
            type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
            <div className="flex items-center">
                {type === 'success' ? <CheckCircle2 className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                <span>{message}</span>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== id))} className="ml-4 text-white/80 hover:text-white">
                <X className="h-4 w-4" />
            </button>
        </div>
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 w-full max-w-xs">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

/**
 * ==========================================
 * FEATURES: AUTHENTICATION
 * ==========================================
 */

const AuthContext = createContext<{ 
  user: User | null; 
  login: (e: string, p: string) => Promise<void>; 
  register: (n: string, e: string, p: string) => Promise<void>;
  logout: () => void; 
  isLoading: boolean;
  setAuthPage: (p: AuthPageState) => void;
  authPage: AuthPageState;
}>({
  user: null, 
  login: async () => {}, 
  register: async () => {},
  logout: () => {}, 
  isLoading: false,
  setAuthPage: () => {},
  authPage: 'login',
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [authPage, setAuthPage] = useState<AuthPageState>('login');

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const loggedInUser = await api.auth.login(email, password);
            setUser(loggedInUser);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const registeredUser = await api.auth.register(name, email, password);
            setUser(registeredUser);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setAuthPage('login');
    };

    const value = useMemo(() => ({
        user,
        login,
        register,
        logout,
        isLoading,
        authPage,
        setAuthPage
    }), [user, isLoading, authPage]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};


const RegisterPage = () => {
  const { register, isLoading, setAuthPage } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (!name || !email || password.length < 6) {
      showToast('Please fill all fields and ensure password is at least 6 characters.', 'error');
      return;
    }

    try {
      await register(name, email, password);
      showToast('Registration successful! Logging you in.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Register</CardTitle>
          <p className="text-center text-sm text-slate-500">Create a new account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="m@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (min 6 chars)</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
            <div className="text-center text-sm text-slate-500 mt-4">
              Already have an account? <Button variant="link" type="button" onClick={() => setAuthPage('login')} className="p-0 h-auto">Sign In</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const LoginPage = () => {
  const { login, isLoading, setAuthPage } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const [email, setEmail] = useState('admin@school.edu');
  const [password, setPassword] = useState('password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      showToast('Logged in successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials', 'error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">School Management</CardTitle>
          <p className="text-center text-sm text-slate-500">Enter your email and password to sign in</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="m@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <div className="text-center text-sm text-slate-500 mt-4">
              Don't have an account? <Button variant="link" type="button" onClick={() => setAuthPage('register')} className="p-0 h-auto">Sign Up</Button>
            </div>
            <div className="text-center text-xs text-slate-500 mt-4">
              Try: admin@school.edu / password
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * ==========================================
 * FEATURES: DASHBOARD & LAYOUT
 * ==========================================
 */

const Sidebar = ({ currentView, setView, isMobileOpen, closeMobile }: { currentView: AppView, setView: (v: AppView) => void, isMobileOpen: boolean, closeMobile: () => void }) => {
  const { logout, user } = useContext(AuthContext);

  const menuItems: { id: AppView, label: string, icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: Users },
  ];

  const baseClasses = "fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0";
  // Use 'isMobileOpen' prop for correct mobile state.
  const mobileClasses = isMobileOpen ? "translate-x-0" : "-translate-x-full"; 

  return (
    <div className={`${baseClasses} ${mobileClasses} flex flex-col`}>
      <div className="flex h-16 items-center px-6 font-bold text-lg tracking-wider border-b border-slate-800">
        PORTAL
      </div>
      <div className="flex-1 py-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setView(item.id); closeMobile(); }}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              currentView.startsWith(item.id) ? 'bg-slate-800 text-white border-r-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
            {user?.name.charAt(0)}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
        </div>
        <Button variant="destructive" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

// Modified DashboardHome to accept setView prop
const DashboardHome = ({ setView }: { setView: (view: AppView) => void }) => {
  const [stats, setStats] = useState({ depts: 0, students: 0, teachers: 0 });

  useEffect(() => {
    // Quick load stats
    setStats({
      depts: mockDb.departments.length,
      students: mockDb.students.length,
      teachers: mockDb.teachers.length
    });
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-slate-500">Total registered in system</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Students" value={stats.students} icon={GraduationCap} color="text-indigo-500" />
        <StatCard title="Total Teachers" value={stats.teachers} icon={Users} color="text-emerald-500" />
        <StatCard title="Departments" value={stats.depts} icon={Building2} color="text-blue-500" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Activity Update</p>
                    <p className="text-sm text-slate-500">Department was updated successfully.</p>
                  </div>
                  <div className="ml-auto font-medium text-sm text-slate-500">Just now</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* ADDED onClick handlers to navigate */}
            <Button variant="outline" className="w-full justify-start" onClick={() => setView('students')}>
               <Plus className="mr-2 h-4 w-4" /> Add Student
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setView('teachers')}>
               <Plus className="mr-2 h-4 w-4" /> Add Teacher
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setView('departments')}>
               <Building2 className="mr-2 h-4 w-4" /> Manage Departments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * ==========================================
 * GENERIC CRUD COMPONENTS
 * ==========================================
 */

const DataTable = ({ 
  data, 
  columns, 
  onEdit, 
  onDelete,
  onView 
}: { 
  data: any[], 
  columns: { key: string, label: string }[], 
  onEdit: (item: any) => void, 
  onDelete: (item: any) => void,
  onView?: (item: any) => void 
}) => {
  if (data.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Search className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No data found</h3>
        <p className="mb-4 mt-2 text-sm text-slate-500">Create a new record to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3">{col.label}</th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-slate-50/50 transition-colors">
                {columns.map(col => (
                  <td key={`${row.id}-${col.key}`} className="px-4 py-3">
                    {/* Handle nested object access for columns like 'department.name' */}
                    {col.key.includes('.') 
                      ? col.key.split('.').reduce((o: any, i: string) => o?.[i], row) 
                      : row[col.key]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  {onView && (
                    <Button variant="ghost" size="icon" onClick={() => onView(row)} title="View Details">
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onEdit(row)} title="Edit">
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(row)} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * ==========================================
 * VIEW: Department Manager
 * Handles the Department CRUD operations.
 * ==========================================
 */
const DepartmentView = () => {
  const { showToast } = useContext(ToastContext);
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState(''); // State for filtering by ID/Code
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const allDepts = await api.departments.getAll();
      
      let filteredDepts = allDepts;
      const query = filterQuery.trim().toLowerCase();

      // Filter by ID, Code, or Name if query is present
      if (query) {
        filteredDepts = allDepts.filter(d => 
          d.id.toLowerCase().includes(query) || 
          d.code.toLowerCase().includes(query) ||
          d.name.toLowerCase().includes(query)
        );
      }

      setData(filteredDepts);
    } catch (e) {
      showToast('Failed to load departments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger reload when filterQuery changes
  useEffect(() => { loadData(); }, [filterQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading while API call is in progress
    try {
      if (editingItem) {
        await api.departments.update(editingItem.id, formData);
        showToast('Department updated successfully', 'success');
      } else {
        await api.departments.create(formData);
        showToast('Department created successfully', 'success');
      }
      setIsModalOpen(false);
      loadData(); // Reload data after successful operation
    } catch (error) {
      showToast('Operation failed', 'error');
    } finally {
        setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', code: '', description: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item: Department) => {
    setEditingItem(item);
    setFormData({ name: item.name, code: item.code, description: item.description });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Department) => {
    // IMPORTANT: Custom modal should be used instead of window.confirm in real apps
    if (window.confirm(`Are you sure you want to delete department: ${item.name}? This action cannot be undone.`)) { 
      setLoading(true);
      try {
        await api.departments.delete(item.id);
        showToast('Department deleted successfully', 'success');
        loadData();
      } catch (e) {
        showToast('Deletion failed', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
        <Button onClick={openCreate} disabled={loading}><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
      </div>

      {/* Department Filter Input */}
      <div className="flex justify-start">
         <Input
            placeholder="Search by ID, Name, or Code"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            className="max-w-md"
          />
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-slate-900" /></div>
      ) : (
        <DataTable 
          data={data}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' },
            { key: 'description', label: 'Description' }
          ]}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Department Create/Edit Modal */}
      <Dialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? `Edit Department: ${editingItem.name}` : 'Create New Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Department Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Code (e.g., CS, MATH)</Label>
            <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};


/**
 * ==========================================
 * VIEW: Student Manager
 * ==========================================
 */

interface StudentData extends Student {
    departmentName: string;
}

const StudentView = () => {
    const { showToast } = useContext(ToastContext);
    const [data, setData] = useState<StudentData[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Student | null>(null);

    const [formData, setFormData] = useState<Omit<Student, 'id' | 'enrollmentDate'>>({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        departmentId: '' 
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [allStudents, allDepts] = await Promise.all([
                api.students.getAll(),
                api.departments.getAll()
            ]);
            setDepartments(allDepts);

            const deptMap = new Map(allDepts.map(d => [d.id, d.name]));
            
            let processedStudents: StudentData[] = allStudents.map(s => ({
                ...s,
                departmentName: deptMap.get(s.departmentId) || 'N/A'
            }));

            const query = filterQuery.trim().toLowerCase();
            if (query) {
                processedStudents = processedStudents.filter(s => 
                    // ADDED ID SEARCH HERE
                    s.id.toLowerCase().includes(query) || 
                    s.firstName.toLowerCase().includes(query) || 
                    s.lastName.toLowerCase().includes(query) ||
                    s.email.toLowerCase().includes(query) ||
                    s.departmentName.toLowerCase().includes(query)
                );
            }

            setData(processedStudents);
        } catch (e) {
            showToast('Failed to load student data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [filterQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingItem) {
                await api.students.update(editingItem.id, formData);
                showToast('Student updated successfully', 'success');
            } else {
                await api.students.create(formData as Omit<Student, 'id'>);
                showToast('Student created successfully', 'success');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            showToast('Operation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ firstName: '', lastName: '', email: '', departmentId: departments[0]?.id || '' });
        setIsModalOpen(true);
    };

    const openEdit = (item: Student) => {
        setEditingItem(item);
        setFormData({ 
            firstName: item.firstName, 
            lastName: item.lastName, 
            email: item.email, 
            departmentId: item.departmentId 
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (item: Student) => {
        if (window.confirm(`Are you sure you want to delete student: ${item.firstName} ${item.lastName}?`)) { 
            setLoading(true);
            try {
                await api.students.delete(item.id);
                showToast('Student deleted successfully', 'success');
                loadData();
            } catch (e) {
                showToast('Deletion failed', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Students</h2>
                <Button onClick={openCreate} disabled={loading}><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
            </div>

            <div className="flex justify-start">
                 <Input
                    placeholder="Search by ID, Name, Email, or Department"
                    value={filterQuery}
                    onChange={e => setFilterQuery(e.target.value)}
                    className="max-w-md"
                  />
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-slate-900" /></div>
            ) : (
                <DataTable 
                    data={data}
                    columns={[
                        { key: 'id', label: 'ID' },
                        { key: 'firstName', label: 'First Name' },
                        { key: 'lastName', label: 'Last Name' },
                        { key: 'email', label: 'Email' },
                        { key: 'departmentName', label: 'Department' },
                        { key: 'enrollmentDate', label: 'Enrolled Date' },
                    ]}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Student Create/Edit Modal */}
            <Dialog 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingItem ? `Edit Student: ${editingItem.firstName} ${editingItem.lastName}` : 'Enroll New Student'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select 
                            value={formData.departmentId} 
                            onChange={e => setFormData({...formData, departmentId: e.target.value})} 
                            required
                        >
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingItem ? 'Update Student' : 'Enroll Student'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};

/**
 * ==========================================
 * VIEW: Teacher Details (for the Teacher Manager)
 * ==========================================
 */

const TeacherDetails = ({ teacherId, setView, setTeacherId }: { teacherId: string, setView: (v: AppView, id?: string) => void, setTeacherId: (id: string | undefined) => void }) => {
    const { showToast } = useContext(ToastContext);
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [department, setDepartment] = useState<Department | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDetails = async () => {
            setLoading(true);
            try {
                const t = await api.teachers.getById(teacherId);
                setTeacher(t);

                const d = await api.departments.getById(t.departmentId);
                setDepartment(d);

                // Mock fetching students in the teacher's department (simplified for mock DB)
                const s = await api.students.getAll(t.departmentId);
                setStudents(s);

            } catch (e) {
                showToast('Failed to load teacher details.', 'error');
                setView('teachers'); // Redirect back if fetch fails
            } finally {
                setLoading(false);
            }
        };
        loadDetails();
    }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleBack = () => {
        setTeacherId(undefined);
        setView('teachers');
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-slate-900" /></div>;
    }

    if (!teacher) return <div className="text-center p-8 text-slate-500">Teacher not found.</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" className="text-lg font-semibold -ml-4" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Teachers
            </Button>
            <Card className="p-8">
                <div className="flex items-center space-x-6">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                        {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{teacher.firstName} {teacher.lastName}</h2>
                        <p className="text-slate-500">{teacher.email}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6 border-t pt-6">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500">Department</p>
                        <p className="text-lg font-semibold text-slate-900">{department?.name} ({department?.code})</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-500">Specialization</p>
                        <p className="text-lg font-semibold text-slate-900">{teacher.specialization}</p>
                    </div>
                </div>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Students in {department?.name} ({students.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {students.length > 0 ? (
                        <DataTable 
                            data={students}
                            columns={[
                                { key: 'id', label: 'ID' },
                                { key: 'firstName', label: 'First Name' },
                                { key: 'lastName', label: 'Last Name' },
                                { key: 'email', label: 'Email' },
                                { key: 'enrollmentDate', label: 'Enrolled Date' },
                            ]}
                            onEdit={() => showToast("Editing student not available from this view.", "error")}
                            onDelete={() => showToast("Deleting student not available from this view.", "error")}
                        />
                    ) : (
                        <p className="text-slate-500">No students currently enrolled in this department.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

/**
 * ==========================================
 * VIEW: Teacher Manager
 * ==========================================
 */

interface TeacherData extends Teacher {
    departmentName: string;
}

const TeacherView = ({ setView, setTeacherId }: { setView: (v: AppView, id?: string) => void, setTeacherId: (id: string | undefined) => void }) => {
    const { showToast } = useContext(ToastContext);
    const [data, setData] = useState<TeacherData[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Teacher | null>(null);

    const [formData, setFormData] = useState<Omit<Teacher, 'id'>>({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        departmentId: '', 
        specialization: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [allTeachers, allDepts] = await Promise.all([
                api.teachers.getAll(),
                api.departments.getAll()
            ]);
            setDepartments(allDepts);

            const deptMap = new Map(allDepts.map(d => [d.id, d.name]));
            
            let processedTeachers: TeacherData[] = allTeachers.map(t => ({
                ...t,
                departmentName: deptMap.get(t.departmentId) || 'N/A'
            }));

            const query = filterQuery.trim().toLowerCase();
            if (query) {
                processedTeachers = processedTeachers.filter(t => 
                    // ADDED ID SEARCH HERE
                    t.id.toLowerCase().includes(query) ||
                    t.firstName.toLowerCase().includes(query) || 
                    t.lastName.toLowerCase().includes(query) ||
                    t.email.toLowerCase().includes(query) ||
                    t.departmentName.toLowerCase().includes(query) ||
                    t.specialization.toLowerCase().includes(query)
                );
            }

            setData(processedTeachers);
        } catch (e) {
            showToast('Failed to load teacher data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [filterQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingItem) {
                await api.teachers.update(editingItem.id, formData);
                showToast('Teacher updated successfully', 'success');
            } else {
                await api.teachers.create(formData);
                showToast('Teacher created successfully', 'success');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            showToast('Operation failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingItem(null);
        setFormData({ 
            firstName: '', 
            lastName: '', 
            email: '', 
            departmentId: departments[0]?.id || '', 
            specialization: '' 
        });
        setIsModalOpen(true);
    };

    const openEdit = (item: Teacher) => {
        setEditingItem(item);
        setFormData({ 
            firstName: item.firstName, 
            lastName: item.lastName, 
            email: item.email, 
            departmentId: item.departmentId, 
            specialization: item.specialization 
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (item: Teacher) => {
        if (window.confirm(`Are you sure you want to delete teacher: ${item.firstName} ${item.lastName}?`)) { 
            setLoading(true);
            try {
                await api.teachers.delete(item.id);
                showToast('Teacher deleted successfully', 'success');
                loadData();
            } catch (e) {
                showToast('Deletion failed', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleView = (item: Teacher) => {
        setTeacherId(item.id);
        setView('teacherDetails', item.id);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Teachers</h2>
                <Button onClick={openCreate} disabled={loading}><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button>
            </div>

            <div className="flex justify-start">
                 <Input
                    placeholder="Search by ID, Name, Email, or Specialization"
                    value={filterQuery}
                    onChange={e => setFilterQuery(e.target.value)}
                    className="max-w-md"
                  />
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-slate-900" /></div>
            ) : (
                <DataTable 
                    data={data}
                    columns={[
                        { key: 'id', label: 'ID' },
                        { key: 'firstName', label: 'First Name' },
                        { key: 'lastName', label: 'Last Name' },
                        { key: 'email', label: 'Email' },
                        { key: 'specialization', label: 'Specialization' },
                        { key: 'departmentName', label: 'Department' },
                    ]}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                />
            )}

            {/* Teacher Create/Edit Modal */}
            <Dialog 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingItem ? `Edit Teacher: ${editingItem.firstName} ${editingItem.lastName}` : 'Add New Teacher'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Specialization</Label>
                        <Input value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} required placeholder="e.g., Quantum Mechanics" />
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select 
                            value={formData.departmentId} 
                            onChange={e => setFormData({...formData, departmentId: e.target.value})} 
                            required
                        >
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingItem ? 'Update Teacher' : 'Add Teacher'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};

/**
 * ==========================================
 * MAIN LAYOUT & APP CONTAINER
 * ==========================================
 */

const MainLayout = ({ user }: { user: User }) => {
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [teacherIdForDetails, setTeacherIdForDetails] = useState<string | undefined>(undefined);

    const setView = (view: AppView, id?: string) => {
        setCurrentView(view);
        if (view === 'teacherDetails' && id) {
            setTeacherIdForDetails(id);
        } else {
            setTeacherIdForDetails(undefined);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardHome setView={setView} />;
            case 'departments':
                return <DepartmentView />;
            case 'students':
                return <StudentView />;
            case 'teachers':
                return <TeacherView setView={setView} setTeacherId={setTeacherIdForDetails} />;
            case 'teacherDetails':
                // Check if teacherIdForDetails is defined before rendering the details view
                return teacherIdForDetails 
                    ? <TeacherDetails teacherId={teacherIdForDetails} setView={setView} setTeacherId={setTeacherIdForDetails} />
                    : <TeacherView setView={setView} setTeacherId={setTeacherIdForDetails} />; // Fallback
            default:
                return <DashboardHome setView={setView} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar 
                currentView={currentView} 
                setView={setView} 
                isMobileOpen={isMobileMenuOpen} 
                closeMobile={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header/Top Bar */}
                <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b shadow-sm">
                    <button 
                        className="lg:hidden p-2 rounded-md hover:bg-slate-100" 
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1 lg:pl-4 text-xl font-semibold hidden lg:block">
                        {/* Dynamically show current section title */}
                        {currentView.charAt(0).toUpperCase() + currentView.slice(1).replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-slate-700 hidden sm:block">
                            Welcome, {user.name} ({user.role})
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default function App() {
  return (
    <ToastProvider>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </ToastProvider>
  );
}

const AppContent = () => {
    const { user, authPage } = useContext(AuthContext);

    if (user) {
        return <MainLayout user={user} />;
    }

    return authPage === 'login' ? <LoginPage /> : <RegisterPage />;
};
