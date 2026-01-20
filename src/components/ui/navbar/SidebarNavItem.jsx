

const SidebarNavItem = ({
    icon: Icon,
    label,
    badge,
    active,
    onClick,
    collapsed = false,
}) => (
    <div
        onClick={onClick}
        className={`
      group relative flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg
      transition-all duration-200 ease-out
      ${active
                ? "bg-gray-100 text-gray-900"
                : "text-gray-700 hover:bg-gray-50 hover:translate-x-1"
            }
      ${collapsed ? "justify-center px-2" : ""}
    `}
        title={collapsed ? label : ""}
    >
        {/* Left active indicator */}
        <span
            className={`
        absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r
        transition-all duration-200
        ${active
                    ? "bg-gray-900"
                    : "bg-transparent group-hover:bg-gray-300"
                }
      `}
        />

        <Icon
            size={20}
            className={`transition-transform duration-200 group-hover:scale-110 ${collapsed ? "mx-auto" : ""}`}
        />

        {!collapsed && <span className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden">{label}</span>}

        {!collapsed && badge && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {badge}
            </span>
        )}
        {collapsed && badge && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
    </div>
);

export default SidebarNavItem;
