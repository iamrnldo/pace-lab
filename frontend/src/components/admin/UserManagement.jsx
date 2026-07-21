// src/components/admin/UserManagement.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";
import UserTable from "./UserTable";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, statusFilter],
    queryFn: () =>
      adminService.getUsers({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }) =>
      adminService.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User status updated");
    },
    onError: () => {
      toast.error("Failed to update user status");
    },
  });

  const handleToggleStatus = (userId, currentStatus) => {
    statusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="font-retro text-3xl md:text-4xl text-retro-white tracking-wider">
          MANAGEMENT USER
        </h1>
        <p className="font-mono text-xs text-retro-white/30 tracking-widest mt-1">
          MANAGE ALL REGISTERED USERS
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-retro-white/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-retro w-full pl-10 pr-4 py-2.5 font-sport text-sm tracking-wider"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-retro px-4 py-2.5 font-sport text-sm tracking-wider cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <UserTable
        users={users}
        isLoading={isLoading}
        onToggleStatus={handleToggleStatus}
        isToggling={statusMutation.isPending}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-retro-white/30">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-retro px-4 py-1.5 text-sm font-sport tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← PREV
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-retro px-4 py-1.5 text-sm font-sport tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
            >
              NEXT →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
