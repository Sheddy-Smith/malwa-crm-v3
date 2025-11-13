import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PlusCircle } from "lucide-react";

const LeadsTab = () => (
    <Card>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold dark:text-dark-text">Leads Management</h3>
            <Button><PlusCircle className="h-4 w-4 mr-2"/> Add Lead</Button>
        </div>
        <p className="dark:text-dark-text-secondary text-sm">A table to manage leads (Name, Number, Enquiry For, Date) with filters and actions (Edit, Delete, Convert to Customer) will be implemented here.</p>
    </Card>
);
export default LeadsTab;
