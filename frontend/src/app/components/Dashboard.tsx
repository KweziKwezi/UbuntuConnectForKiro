export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>Dashboard</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">User</span>
            <button className="text-sm px-4 py-2 border rounded">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="text-2xl mb-2">Overview</div>
          <div className="text-gray-600">Dashboard</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded border">
            <div className="text-gray-600 text-sm mb-2">Total</div>
            <div className="text-3xl">0</div>
          </div>
          <div className="bg-white p-6 rounded border">
            <div className="text-gray-600 text-sm mb-2">Active</div>
            <div className="text-3xl">0</div>
          </div>
          <div className="bg-white p-6 rounded border">
            <div className="text-gray-600 text-sm mb-2">Pending</div>
            <div className="text-3xl">0</div>
          </div>
        </div>

        <div className="bg-white rounded border">
          <div className="px-6 py-4 border-b">
            <div>Recent Activity</div>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">No data available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
