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
import { useClassrooms, Classroom } from "@/hooks/useClassrooms";
import { toast } from "sonner";

export default function Classrooms() {
  const { classrooms, loading, addClassroom, updateClassroom, deleteClassroom } = useClassrooms();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", capacity: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.capacity) {
      toast.error("Please fill in all fields");
      return;
    }

    let success;
    if (editingId) {
      success = await updateClassroom(editingId, {
        name: formData.name,
        capacity: Number(formData.capacity),
      });
    } else {
      success = await addClassroom({
        name: formData.name,
        capacity: Number(formData.capacity),
      });
    }

    if (success) {
      setFormData({ name: "", capacity: "" });
      setEditingId(null);
      setOpen(false);
    }
  };

  const handleEdit = (classroom: Classroom) => {
    setFormData({ name: classroom.name, capacity: classroom.capacity.toString() });
    setEditingId(classroom.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteClassroom(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading classrooms...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classrooms</h1>
          <p className="text-muted-foreground mt-1">
            Manage your classroom inventory
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setFormData({ name: "", capacity: "" }); setEditingId(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Classroom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Classroom" : "Add New Classroom"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Classroom Name/Code</Label>
                <Input
                  id="name"
                  placeholder="e.g., S111, Lab-01"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Update" : "Add"} Classroom
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Classroom Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classrooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No classrooms added yet. Click "Add Classroom" to get started.
                </TableCell>
              </TableRow>
            ) : (
              classrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell className="font-medium">{classroom.name}</TableCell>
                  <TableCell>{classroom.capacity} students</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(classroom)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(classroom.id)}
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
