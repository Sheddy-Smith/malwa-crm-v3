import { useState, useEffect } from "react";
import TabbedPage from "@/components/TabbedPage";
import UserManagementTab from "./settings/UserManagementTab";
import CompanyMasterTab from "./settings/CompanyMasterTab";
import GeneralSettingsTab from "./settings/GeneralSettingsTab";
import InvoiceSettingsTab from "./settings/InvoiceSettingsTab";
import InventorySettingsTab from "./settings/InventorySettingsTab";
import LedgerSettingsTab from "./settings/LedgerSettingsTab";
import MultiplierSettingsTab from "./settings/MultiplierSettingsTab";
import SecuritySettingsTab from "./settings/SecuritySettingsTab";
import BackupSettingsTab from "./settings/BackupSettingsTab";
import AboutTab from "./settings/AboutTab";
import AdminPasswordModal from "@/components/AdminPasswordModal";
import useAuthStore from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { dbOperations } from "@/lib/db";

const allTabs = [
  { id: "general", label: "General", component: GeneralSettingsTab },
  { id: "company", label: "Company Master", component: CompanyMasterTab },
  { id: "invoice", label: "Invoice Settings", component: InvoiceSettingsTab },
  { id: "inventory", label: "Inventory Settings", component: InventorySettingsTab },
  { id: "ledger", label: "Ledger Settings", component: LedgerSettingsTab },
  { id: "multiplier", label: "Multiplier Settings", component: MultiplierSettingsTab },
  { id: "users", label: "User Management", component: UserManagementTab, directorOnly: true },
  { id: "security", label: "Security", component: SecuritySettingsTab },
  { id: "backup", label: "Backup & Restore", component: BackupSettingsTab },
  { id: "about", label: "About", component: AboutTab }
];

const Settings = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, [user]);

  const checkUserRole = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      let role = user.role || "Accountant";

      if (user.id) {
        const profile = await dbOperations.getById("profiles", user.id);
        if (profile) {
          role = profile.role;
        }
      }

      setUserRole(role);

      if (role === "Director") {
        setShowPasswordModal(true);
      } else {
        setIsVerified(true);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole(user.role || "Accountant");
      setIsVerified(true);
      setLoading(false);
    }
  };

  const handlePasswordSuccess = () => {
    setIsVerified(true);
    setShowPasswordModal(false);
  };

  const handlePasswordCancel = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (userRole === "Director" && !isVerified) {
    return (
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onSuccess={handlePasswordSuccess}
        onCancel={handlePasswordCancel}
      />
    );
  }

  const availableTabs = allTabs.filter(tab =>
    !tab.directorOnly || userRole === "Director"
  );

  return <TabbedPage tabs={availableTabs} title="Settings" />;
};

export default Settings;
