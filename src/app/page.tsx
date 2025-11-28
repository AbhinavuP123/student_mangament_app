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
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Menu,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/**
 * ==========================================
 * TYPES & INTERFACES
 * ==========================================
 */

type UserRole = 'admin' | 'user';
type AuthPageState = 'login' | 'register';

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

// Mock API Response wrapper
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * ==========================================
 * MOCK API SERVICE
 * Simulates the backend described in the prompt
 * ==========================================
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockDb = {
  // Initial data for CRUD operations
  departments: [
    { id: '1', name: 'Computer Science', code: 'CS', description: 'Software and Hardware engineering' },
    { id: '2', name: 'Mathematics', code: 'MATH', description: 'Pure and Applied Mathematics' },
    { id: '3', name: 'Physics', code: 'PHY', description: 'Study of matter and energy' },
  ] as Department[],
  students: [
    { id: '1', firstName: 'Alice', lastName: 'Smith', email: 'alice@school.edu', departmentId: '1', enrollmentDate: '2023-09-01' },
    { id: '2', firstName: 'Bob', lastName: 'Johnson', email: 'bob@school.edu', departmentId: '2', enrollmentDate: '2023-09-01' },
  ] as Student[],
  teachers: [
    { id: '1', firstName: 'Dr. Emily', lastName: 'Brown', email: 'emily@school.edu', departmentId: '1', specialization: 'AI' },
    { id: '2', firstName: 'Prof. Alan', lastName: 'Davis', email: 'alan@school.edu', departmentId: '2', specialization: 'Calculus' },
  ] as Teacher[],
  // Mock user storage for registration and login
  users: [
    { id: 'u1', name: 'Admin User', email: 'admin@school.edu', password: 'password', role: 'admin' },
  ] as (User & { password: string })[]
};

const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(800);
      const userRecord = mockDb.users.find(u => u.email === email && u.password === password);
      if (userRecord) {
        // Return user without password
        const { password: _, ...user } = userRecord;
        return user;
      }
      throw new Error('Invalid credentials');
    },
    register: async (name: string, email: string, password: string): Promise<User> => {
      await delay(800);
      if (mockDb.users.some(u => u.email === email)) {
        throw new Error('User already exists');
      }
      const newUserRecord = { 
        id: Math.random().toString(36).substr(2, 9), 
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
    getAll: async () => { await delay(500); return [...mockDb.departments]; },
    create: async (data: Omit<Department, 'id'>) => {
      await delay(500);
      const newDept = { ...data, id: Math.random().toString(36).substr(2, 9) };
      mockDb.departments.push(newDept);
      return newDept;
    },
    update: async (id: string, data: Partial<Department>) => {
      await delay(500);
      const idx = mockDb.departments.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Not found');
      mockDb.departments[idx] = { ...mockDb.departments[idx], ...data };
      return mockDb.departments[idx];
    },
    delete: async (id: string) => {
      await delay(500);
      mockDb.departments = mockDb.departments.filter(d => d.id !== id);
      return true;
    }
  },
  students: {
    getAll: async (deptId?: string) => { 
      await delay(500); 
      return deptId 
        ? mockDb.students.filter(s => s.departmentId === deptId)
        : [...mockDb.students]; 
    },
    create: async (data: Omit<Student, 'id'>) => {
      await delay(500);
      const newStudent = { ...data, id: Math.random().toString(36).substr(2, 9) };
      mockDb.students.push(newStudent);
      return newStudent;
    },
    update: async (id: string, data: Partial<Student>) => {
      await delay(500);
      const idx = mockDb.students.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Not found');
      mockDb.students[idx] = { ...mockDb.students[idx], ...data };
      return mockDb.students[idx];
    },
    delete: async (id: string) => {
      await delay(500);
      mockDb.students = mockDb.students.filter(s => s.id !== id);
      return true;
    }
  },
  teachers: {
    getAll: async (deptId?: string) => { 
      await delay(500); 
      return deptId 
        ? mockDb.teachers.filter(t => t.departmentId === deptId)
        : [...mockDb.teachers]; 
    },
    create: async (data: Omit<Teacher, 'id'>) => {
      await delay(500);
      const newTeacher = { ...data, id: Math.random().toString(36).substr(2, 9) };
      mockDb.teachers.push(newTeacher);
      return newTeacher;
    },
    update: async (id: string, data: Partial<Teacher>) => {
      await delay(500);
      const idx = mockDb.teachers.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Not found');
      mockDb.teachers[idx] = { ...mockDb.teachers[idx], ...data };
      return mockDb.teachers[idx];
    },
    delete: async (id: string) => {
      await delay(500);
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

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link', size?: 'default' | 'sm' | 'icon' }>(
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
const ToastContext = createContext<{ showToast: (msg: string, type: 'success' | 'error') => void }>({ showToast: () => {} });

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

const Sidebar = ({ currentView, setView, isMobileOpen, closeMobile }: { currentView: string, setView: (v: string) => void, isMobileOpen: boolean, closeMobile: () => void }) => {
  const { logout, user } = useContext(AuthContext);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: Users },
  ];

  const baseClasses = "fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0";
  const mobileClasses = isMobileOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <div className={`${baseClasses} ${mobileClasses} flex flex-col`}>
      <div className="flex h-16 items-center px-6 font-bold text-lg tracking-wider border-b border-slate-800">
        EDUSPACE
      </div>
      <div className="flex-1 py-6 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setView(item.id); closeMobile(); }}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              currentView === item.id ? 'bg-slate-800 text-white border-r-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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

const DashboardHome = () => {
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
                    <p className="text-sm font-medium leading-none">New Student Registration</p>
                    <p className="text-sm text-slate-500">Student #{202300 + i} joined Computer Science</p>
                  </div>
                  <div className="ml-auto font-medium text-sm text-slate-500">Just now</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
               <Plus className="mr-2 h-4 w-4" /> Add Student
            </Button>
            <Button variant="outline" className="w-full justify-start">
               <Plus className="mr-2 h-4 w-4" /> Add Teacher
            </Button>
            <Button variant="outline" className="w-full justify-start">
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
  onDelete 
}: { 
  data: any[], 
  columns: { key: string, label: string }[], 
  onEdit: (item: any) => void, 
  onDelete: (item: any) => void 
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
                    {col.key.includes('.') 
                      ? col.key.split('.').reduce((o: any, i: string) => o[i], row) 
                      : row[col.key]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
                    <Pencil className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(row)}>
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

// Department Manager
const DepartmentView = () => {
  const { showToast } = useContext(ToastContext);
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Department | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const loadData = async () => {
    setLoading(true);
    const res = await api.departments.getAll();
    setData(res);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.departments.update(editingItem.id, formData);
        showToast('Department updated', 'success');
      } else {
        await api.departments.create(formData);
        showToast('Department created', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      showToast('Operation failed', 'error');
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
    // Replaced confirm() with a custom modal logic (though here we use a simple window.confirm to avoid overly complex code in a single file)
    if (window.confirm(`Are you sure you want to delete ${item.name}?`)) { 
      await api.departments.delete(item.id);
      showToast('Deleted successfully', 'success');
      loadData();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
      </div>

      {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : 
        <DataTable 
          data={data}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' },
            { key: 'description', label: 'Description' }
          ]}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      }

      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Department' : 'New Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Department Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Code</Label>
            <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

// Student Manager (Generic logic for Student/Teacher reused could be better, but separating for clarity)
const PersonManager = ({ type }: { type: 'student' | 'teacher' }) => {
  const { showToast } = useContext(ToastContext);
  const [data, setData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form State
  const initialForm = { firstName: '', lastName: '', email: '', departmentId: '', extra: '' };
  const [formData, setFormData] = useState(initialForm);

  const apiRef = type === 'student' ? api.students : api.teachers;

  const loadData = async () => {
    setLoading(true);
    const [people, depts] = await Promise.all([
      apiRef.getAll(filterDept || undefined),
      api.departments.getAll()
    ]);
    
    // Map department name to person for display
    const mapped = people.map(p => ({
      ...p,
      departmentName: depts.find(d => d.id === p.departmentId)?.name || 'Unknown'
    }));

    setData(mapped);
    setDepartments(depts);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [filterDept, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      departmentId: formData.departmentId,
    };
    
    // Specific fields
    if (type === 'student') payload.enrollmentDate = formData.extra;
    else payload.specialization = formData.extra;

    try {
      if (editingItem) {
        await apiRef.update(editingItem.id, payload);
        showToast('Updated successfully', 'success');
      } else {
        await apiRef.create(payload);
        showToast('Created successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      showToast('Operation failed', 'error');
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      departmentId: item.departmentId,
      extra: type === 'student' ? item.enrollmentDate : item.specialization
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: any) => {
    // Replaced confirm() with a custom modal logic (though here we use a simple window.confirm to avoid overly complex code in a single file)
    if (window.confirm(`Are you sure you want to delete ${item.firstName}?`)) { 
      await apiRef.delete(item.id);
      showToast('Deleted successfully', 'success');
      loadData();
    }
  };

  const columns = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'departmentName', label: 'Department' },
    type === 'student' 
      ? { key: 'enrollmentDate', label: 'Enrolled' }
      : { key: 'specialization', label: 'Specialization' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight capitalize">{type}s</h2>
        <div className="flex gap-2">
          <Select 
            value={filterDept} 
            onChange={e => setFilterDept(e.target.value)} 
            className="w-[200px]"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add {type === 'student' ? 'Student' : 'Teacher'}</Button>
        </div>
      </div>

      {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : 
        <DataTable data={data} columns={columns} onEdit={openEdit} onDelete={handleDelete} />
      }

      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? `Edit ${type}` : `New ${type}`}>
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
            <Select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{type === 'student' ? 'Enrollment Date' : 'Specialization'}</Label>
            <Input 
              type={type === 'student' ? 'date' : 'text'} 
              value={formData.extra} 
              onChange={e => setFormData({...formData, extra: e.target.value})} 
              required 
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

/**
 * ==========================================
 * MAIN APP COMPONENT
 * ==========================================
 */

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPageState>('login'); // State to switch between login/register

  // --- Auth Logic ---
  const authContextValue = useMemo(() => ({
    user,
    isLoading: authLoading,
    authPage,
    setAuthPage,
    login: async (email: string, password: string) => {
      setAuthLoading(true);
      try {
        const u = await api.auth.login(email, password);
        setUser(u);
      } finally {
        setAuthLoading(false);
      }
    },
    register: async (name: string, email: string, password: string) => {
      setAuthLoading(true);
      try {
        const u = await api.auth.register(name, email, password);
        setUser(u);
      } finally {
        setAuthLoading(false);
      }
    },
    logout: () => {
      setUser(null);
      setCurrentView('dashboard');
      setAuthPage('login'); // Reset to login page on logout
    }
  }), [user, authLoading, authPage]);

  // --- Toast Logic ---
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  // --- View Router ---
  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardHome />;
      case 'departments': return <DepartmentView />;
      case 'students': return <PersonManager type="student" />;
      case 'teachers': return <PersonManager type="teacher" />;
      default: return <DashboardHome />;
    }
  };

  // --- Main Render ---
  return (
    <AuthContext.Provider value={authContextValue}>
      <ToastContext.Provider value={{ showToast }}>
        
        {/* Toast Component */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-[100] rounded-md px-4 py-3 shadow-lg flex items-center gap-2 animate-in slide-in-from-right-full ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
             {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
             <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        )}

        {!user ? (
          authPage === 'login' ? <LoginPage /> : <RegisterPage />
        ) : (
          <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
              <div 
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}

            <Sidebar 
              currentView={currentView} 
              setView={setCurrentView} 
              isMobileOpen={isMobileMenuOpen} 
              closeMobile={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 transition-all">
              <header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
                <button 
                  className="mr-4 lg:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu className="h-6 w-6 text-slate-600" />
                </button>
                <div className="flex-1">
                  <h1 className="text-lg font-semibold capitalize text-slate-800">
                    {currentView.replace('-', ' ')}
                  </h1>
                </div>
              </header>

              <main className="flex-1 p-6 overflow-y-auto">
                <div className="mx-auto max-w-6xl animate-in fade-in duration-500">
                  {renderView()}
                </div>
              </main>
            </div>
          </div>
        )}

      </ToastContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
