import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addTask } from '../store/slices/taskSlice';
import { 
  ArrowLeft, 
  PlusCircle, 
  Calculator, 
  CheckCircle2
} from 'lucide-react';

export default function TaskCreationPage() {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'PesticideApplication',
    priority: 'High',
    fieldId: 'field-north-plot-99',
    cropVariety: 'Tomato',
    estimatedHours: 3.5,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  // Built-in Agrochemical Dosage Calculator Helper
  const [calcHectares, setCalcHectares] = useState(2.0);
  const [calcDosePerHa, setCalcDosePerHa] = useState(2.5);
  const calculatedTotalDose = (Number(calcHectares) * Number(calcDosePerHa)).toFixed(2);

  const [submittedTask, setSubmittedTask] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;

    const res = await dispatch(
      addTask({
        ...formData,
        description: formData.description + ` [Dosage calculated: ${calculatedTotalDose} units for ${calcHectares} ha]`,
      })
    );

    setSubmittedTask(res.payload);
  };

  if (submittedTask) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-emerald-950">Task Successfully Created!</h2>
        <p className="text-sm text-slate-500">
          "{submittedTask.title}" has been registered and queued in the <strong>Pending</strong> column.
        </p>
        <div className="flex items-center justify-center space-x-3 pt-3">
          <Link
            to={`/tasks/${submittedTask.id}`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-bold shadow-sm shadow-emerald-700/20 transition-all"
          >
            View Task in New Tab
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-100/80 hover:bg-emerald-200/90 text-emerald-950 text-xs font-bold shadow-2xs transition-colors"
          >
            Return to Kanban Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 hover:bg-emerald-200/90 hover:text-emerald-950 transition-colors shadow-2xs"
            title="Back to Kanban"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Operations Studio</span>
            <h1 className="text-2xl font-extrabold text-emerald-950 leading-tight">
              Schedule Field Operation (Dedicated Tab)
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Main Task Form Card */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-6 shadow-card-green space-y-5 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/60">
            Operation Parameters
          </h3>

          <div>
            <label className="block font-bold text-emerald-950 mb-1.5 text-sm">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Copper Hydroxide Spray Application for Early Blight Suppression"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-sm px-4 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-emerald-900/40 text-emerald-950 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-emerald-950 mb-1">Operation Type</label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
              >
                <option value="PesticideApplication">🧪 Pesticide Application</option>
                <option value="PestInspection">🔍 Pest Inspection</option>
                <option value="CropMonitoring">🌱 Crop Monitoring</option>
                <option value="Irrigation">💧 Irrigation</option>
                <option value="Harvesting">🌾 Harvesting</option>
                <option value="Pruning">✂️ Pruning</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-emerald-950 mb-1">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-emerald-950 mb-1">Scheduled Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-emerald-950 mb-1">Field Plot ID</label>
              <input
                type="text"
                required
                value={formData.fieldId}
                onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-950"
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-950 mb-1">Crop Variety</label>
              <input
                type="text"
                required
                value={formData.cropVariety}
                onChange={(e) => setFormData({ ...formData, cropVariety: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 text-emerald-950"
              />
            </div>

            <div>
              <label className="block font-bold text-emerald-950 mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 font-medium text-emerald-950"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-emerald-950 mb-1">
              Field Execution Protocol & Instructions
            </label>
            <textarea
              rows="4"
              placeholder="Detail required personal protective equipment (PPE), target row lines, spraying nozzle settings, or safety precautions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-emerald-900/40 text-emerald-950 font-medium"
            ></textarea>
          </div>
        </div>

        {/* Built-in Agrochemical Dosage Calculator */}
        <div className="bg-gradient-to-br from-emerald-100/60 via-emerald-50/80 to-teal-50/60 rounded-2xl border border-emerald-300 p-6 shadow-card-green space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-emerald-950 font-bold text-sm">
            <Calculator className="w-4 h-4 text-emerald-700" />
            <span>Agrochemical Treatment Dosage Assistant</span>
          </div>
          <p className="text-emerald-900 font-medium">
            Compute the recommended volume before dispatching chemical application tasks to field teams:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-emerald-800 font-bold uppercase block mb-1">Area (Hectares)</span>
              <input
                type="number"
                step="0.1"
                value={calcHectares}
                onChange={(e) => setCalcHectares(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] text-emerald-800 font-bold uppercase block mb-1">Dose / Hectare</span>
              <input
                type="number"
                step="0.1"
                value={calcDosePerHa}
                onChange={(e) => setCalcDosePerHa(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-bold"
              />
            </div>
            <div className="p-3 bg-emerald-100/90 rounded-xl border border-emerald-300 flex flex-col justify-center items-center shadow-xs">
              <span className="text-[10px] text-emerald-900 font-bold uppercase">Total Compound</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                {calculatedTotalDose} units
              </span>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-100/60 hover:bg-emerald-200/80 text-emerald-950 text-xs font-bold shadow-2xs transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Task & Publish to Board</span>
          </button>
        </div>

      </form>

    </div>
  );
}
