import { User } from '../types';

interface Props {
  users: User[];
  onLogin: (userId: string) => void;
}

export default function UserSelect({ users, onLogin }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-6xl block mb-4">🔧</span>
          <h1 className="text-3xl font-bold text-slate-800">Автосервис Pro</h1>
          <p className="text-slate-500 mt-2">Выберите пользователя для входа</p>
        </div>
        <div className="space-y-3">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => onLogin(user.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl group-hover:bg-blue-200 transition-colors">
                👤
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800">{user.name}</div>
                <div className="text-sm text-slate-500">{user.role === 'admin' ? 'Администратор' : 'Механик'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
