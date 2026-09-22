import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addTask } from '../../store/slices/taskSlice';
import { X, PlusCircle, ExternalLink } from 'lucide-react';

export default function CreateTaskModal({ onClose }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'PestInspection',
    priority: 'Medium',
    fieldId: 'field-north-plot-1',
    cropVariety: 'Tomato',
    estimatedHours: 2.0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    dispatch(addTask(formData));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/50 backdrop-blur-xs">
      <div className="bg-gradient-to-b from-emerald-50/95 via-white/95 to-teal-50/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
          <div>
            <h3 className="text-lg font-bold text-emerald-950">Schedule Field Task</h3>
            <p className="text-xs text-slate-500">Add operational task to farm workflow</p>
          </div>
          <div className="flex items-center space-x-1.5">
            <a
              href="/tasks/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 hover:bg-emerald-200 text-xs font-bold shadow-2xs transition-colors"
              title="Expand to Full Scheduling Studio in New Tab"
            >
              <span>Full Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-emerald-100/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-emerald-950 mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Copper Hydroxide Foliar Spray Application"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-medium placeholder:text-emerald-900/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-emerald-950 mb-1">Task Type</label>
              <select
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-medium"
              >
                <option value="PestInspection">🔍 Pest Inspection</option>
                <option value="PesticideApplication">🧪 Pesticide Application</option>
                <option value="CropMonitoring">🌱 Crop Monitoring</option>
                <option value="Irrigation">💧 Irrigation</option>
                <option value="Harvesting">🌾 Harvesting</option>
                <option value="Pruning">✂️ Pruning</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-emerald-950 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-medium"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-emerald-950 mb-1">Field Plot ID</label>
              <input
                type="text"
                value={formData.fieldId}
                onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-950"
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
                className="w-full px-3 py-2 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-emerald-950 mb-1">Instructions / Description</label>
            <textarea
              rows="3"
              placeholder="Provide field instructions or safety equipment requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed text-emerald-950 font-medium placeholder:text-emerald-900/40"
            ></textarea>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-emerald-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-sm shadow-emerald-700/20 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule Task</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
