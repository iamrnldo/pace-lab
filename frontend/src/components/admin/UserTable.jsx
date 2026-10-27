// src/components/admin/UserTable.jsx
import clsx from "clsx";

function SkeletonRow() {
  return (
    <tr className="border-b border-retro-gray-light/10">
      {[0, 1, 2, 3].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-retro-gray-light/10 animate-pulse rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function UserTable({ users, isLoading, onToggleStatus, isToggling }) {
  return (
    <div className="card-retro overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-retro-green/20 bg-retro-green/5">
              <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                USER
              </th>
              <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                EMAIL
              </th>
              <th className="text-left px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                STATUS
              </th>
              <th className="text-right px-4 py-3 font-retro text-sm text-retro-green tracking-wider">
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center text-retro-white/20">
                    <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="font-sport text-sm tracking-wider">No users found</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-retro-gray-light/10 hover:bg-retro-green/5 transition-colors"
                >
                  {/* User Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-8 h-8 border border-retro-green/30"
                        />
                      ) : (
                        <div className="w-8 h-8 border border-retro-green/30 flex items-center justify-center bg-retro-gray">
                          <span className="font-retro text-sm text-retro-green">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-sport text-sm text-retro-white tracking-wider">
                          {user.name}
                        </p>
                        <p className="font-mono text-[10px] text-retro-white/30">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-retro-white/50">
                      {user.email}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider px-2.5 py-1 border",
                        user.is_active
                          ? "text-retro-green border-retro-green/30 bg-retro-green/5"
                          : "text-red-400 border-red-400/30 bg-red-400/5"
                      )}
                    >
                      <span
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          user.is_active ? "bg-retro-green" : "bg-red-400"
                        )}
                      />
                      {user.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onToggleStatus(user.id, user.is_active)}
                      disabled={isToggling || user.role === "admin"}
                      className={clsx(
                        "btn-retro px-3 py-1.5 text-xs font-sport tracking-wider",
                        user.is_active
                          ? "text-red-400 border-red-400/40 hover:border-red-400"
                          : "text-retro-green border-retro-green/40 hover:border-retro-green",
                        (isToggling || user.role === "admin") &&
                          "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {user.is_active ? "DEACTIVATE" : "ACTIVATE"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
