import React from "react";
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalculatorIcon,
  CreditCardIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  ArrowRightCircleIcon,
  StarIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", icon: AcademicCapIcon, path: "/" },
  { name: "Document Vault", icon: DocumentTextIcon, path: "/vault" },
  { name: "Upload Files", icon: DocumentTextIcon, path: "/upload" },
  { name: "Tax Calculator", icon: CalculatorIcon, path: "/tax" },
  { name: "CIBIL Advisor", icon: CreditCardIcon, path: "/cibil" },
  { name: "Debt Simulator", icon: BanknotesIcon, path: "/debt" },
  { name: "Capital Gains Analyzer", icon: BanknotesIcon, path: "/capital-gains" },
  { name: "Reports", icon: ShieldCheckIcon, path: "/reports" },
  { name: "Analytics", icon: ChartBarIcon, path: "/analytics" },
  { name: "Help & Support", icon: QuestionMarkCircleIcon, path: "/help" },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="h-screen w-64 bg-white border-r border-gray-100 flex flex-col justify-between">
      <div>
        {/* Sidebar header removed for minimal look, branding only in navbar */}
        <nav className="mt-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="px-6 py-6">
        <Link
          to="/upgrade"
          className="flex items-center justify-between bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          <span>Pro Features</span>
          <ArrowRightCircleIcon className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;