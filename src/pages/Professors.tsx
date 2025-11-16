import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Professor } from "@/types";
import { toast } from "sonner";

export default function Professors() {
  const [professors, setProfessors] = useLocalStorage<Professor[]>("professors", []);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    hoursPerWeek: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.department || !formData.hoursPerWeek) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingId) {
      setProfessors(
        professors.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: formData.name,
                email: formData.email,
                department: formData.department,
                hoursPerWeek: Number(formData.hoursPerWeek),
              }
            : p
        )
      );
      toast.success("Professor updated successfully");
    } else {
      const newProfessor: Professor = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        department: formData.department,
        hoursPerWeek: Number(formData.hoursPerWeek),
      };
      setProfessors([...professors, newProfessor]);
      toast.success("Professor added successfully");
    }

    setFormData({ name: "", email: "", department: "", hoursPerWeek: "" });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (professor: Professor) => {
    setFormData({
      name: professor.name,
      email: professor.email,
      department: professor.department,
      hoursPerWeek: professor.hoursPerWeek.toString(),
    });
    setEditingId(professor.id);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setProfessors(professors.filter((p) => p.id !== id));
    toast.success("Professor deleted successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Professors</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teaching staff
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ name: "", email: "", department: "", hoursPerWeek: "" });
                setEditingId(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Professor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Professor" : "Add New Professor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dr. Ahmed Hassan"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., ahmed@university.edu"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Computer Science"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours Per Week</Label>
                <Input
                  id="hours"
                  type="number"
                  placeholder="e.g., 20"
                  value={formData.hoursPerWeek}
                  onChange={(e) =>
                    setFormData({ ...formData, hoursPerWeek: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Add"} Professor
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Hours/Week</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No professors added yet. Click "Add Professor" to get started.
                </TableCell>
              </TableRow>
            ) : (
              professors.map((professor) => (
                <TableRow key={professor.id}>
                  <TableCell className="font-medium">{professor.name}</TableCell>
                  <TableCell>{professor.email}</TableCell>
                  <TableCell>{professor.department}</TableCell>
                  <TableCell>{professor.hoursPerWeek}h</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(professor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(professor.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
