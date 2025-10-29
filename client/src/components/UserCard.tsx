import { User } from '../types';

interface UserCardProps {
  user: User;
  onDelete?: (id: number) => void;
}

export const UserCard = ({ user, onDelete }: UserCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{user?.name}</h3>
          <div className="text-xs text-gray-500 mt-1">CPF: {user?.cpf}</div>
          <div className="text-xs text-gray-500">Matrícula: {user?.matricula}</div>
          <div className="text-xs text-gray-500">Cargo: {user?.cargo}</div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(user.id)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
          >
            Deletar
          </button>
        )}
      </div>
    </div>
  );
};
