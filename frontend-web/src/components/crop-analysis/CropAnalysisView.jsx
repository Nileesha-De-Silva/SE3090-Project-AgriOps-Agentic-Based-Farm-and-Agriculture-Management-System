import { useState, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { runAgentAnalysis } from '../../store/slices/cropAnalysisSlice';
import { 
  Sparkles, 
  RefreshCw, 
  ShieldAlert, 
  Cpu, 
  FileText,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function CropAnalysisView() {
  const dispatch = useDispatch();
  const { activeAnalysisResult, isAnalyzing } = useSelector((state) => state.cropAnalysis);

  const [formData, setFormData] = useState({
    fieldId: 'field-north-plot-99',
    cropVariety: 'Tomato',
    growthStage: 'Fruiting',
    observation: 'Caterpillars chewing large entry holes into fruits with dark frass.',
    imageUrl: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.observation) return;
    dispatch(runAgentAnalysis(formData));
  };

  const handleQuickFill = (preset) => {
    if (preset === 'critical_pest') {
      setFormData({
        fieldId: 'field-plot-pest-42',
        cropVariety: 'Tomato',
        growthStage: 'Fruiting',
        observation: 'caterpillars and worms eating holes through tomato fruits',
        imageUrl: '',
      });
    } else if (preset === 'blight') {
      setFormData({
        fieldId: 'field-east-fungus-05',
        cropVariety: 'Tomato',
        growthStage: 'Flowering',
        observation: 'Dark brown fungal spots with concentric rings spreading rapidly on leaves',
        imageUrl: '',
      });
    } else {
      setFormData({
        fieldId: 'field-north-plot-1',
        cropVariety: 'Tomato',
        growthStage: 'Vegetative',
        observation: 'routine check, healthy growth, minor dust on leaves',
        imageUrl: '',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">
            AI Crop Analysis Sandbox
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Gemini 3.8 Flash
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Submit field observations to Agent 2 to execute ReAct handbook lookup, self-correcting query grading, and risk gating.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-5 sm:p-6 shadow-card-green space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
            <h3 className="text-sm font-bold text-emerald-950">New Crop Observation</h3>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('critical_pest')}
                className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                title="Fill with Critical Pest observation"
              >
                Pest Preset
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('routine')}
                className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors"
                title="Fill with Routine observation"
              >
                Routine
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-emerald-950 mb-1">Field Plot ID</label>
                <input
                  type="text"
                  required
                  value={formData.fieldId}
                  onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-950"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-950 mb-1">Crop Variety</label>
                <input
                  type="text"
                  required
                  value={formData.cropVariety}
                  onChange={(e) => setFormData({ ...formData, cropVariety: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 text-emerald-950"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-emerald-950 mb-1">Growth Stage</label>
              <select
                value={formData.growthStage}
                onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-medium"
              >
                <option value="Seedling">Seedling</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Flowering">Flowering</option>
                <option value="Fruiting">Fruiting</option>
                <option value="Maturation">Maturation</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-emerald-950 mb-1">Visual Observation & Symptoms *</label>
              <textarea
                rows="4"
                required
                placeholder="Describe leaf discolorations, pest markings, or physical stress..."
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/50 focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 leading-relaxed placeholder:text-emerald-900/40 text-emerald-950 font-medium"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] ${
                isAnalyzing
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-700/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Agent 2 Reasoning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Diagnostic Graph</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Diagnostic Trajectory & Output (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Active Result Card */}
          {activeAnalysisResult ? (
            <div className="bg-gradient-to-br from-emerald-50/90 via-white/85 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-5 sm:p-6 shadow-card-green space-y-5">
              
              {/* Result Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Execution Status:</span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      activeAnalysisResult.status === 'awaiting_approval'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {activeAnalysisResult.status === 'awaiting_approval'
                      ? '⏸ Awaiting Manager Approval'
                      : '✅ Completed'}
                  </span>
                </div>

                <span className="text-xs text-emerald-800 font-mono bg-emerald-100/70 px-2.5 py-0.5 rounded-lg border border-emerald-200 font-bold">
                  Tokens: {activeAnalysisResult.total_tokens || 312}
                </span>
              </div>

              {/* Node Trajectory Path */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>LangGraph Trajectory Path</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-emerald-100/40 border border-emerald-200/90 text-xs">
                  {activeAnalysisResult.nodes?.map((node, index) => (
                    <Fragment key={node}>
                      <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-950 border border-emerald-300/80 shadow-2xs">
                        {node}
                      </span>
                      {index < activeAnalysisResult.nodes.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-emerald-600 font-bold" />
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>

              {/* Human-in-the-Loop Alert Banner if Paused */}
              {activeAnalysisResult.status === 'awaiting_approval' && activeAnalysisResult.interrupt && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Human Gate Activated</span>
                  </div>
                  <p className="text-amber-800 font-medium">
                    {activeAnalysisResult.interrupt.ask || 'High-Risk alert requires manager authorization.'}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    This analysis has been routed to your <strong>Approval Inbox</strong>.
                  </p>
                </div>
              )}

              {/* Answer / Output */}
              {activeAnalysisResult.answer && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Grounded Diagnostic Synthesis</span>
                  </label>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950 via-green-950 to-teal-950 text-emerald-100 border border-emerald-800/70 text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                    {activeAnalysisResult.answer}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-50/70 via-white/80 to-teal-50/70 rounded-2xl border border-emerald-200/90 p-12 text-center space-y-3 shadow-card-green">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950">Agent 2 Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill in the observation form on the left to trigger the graph workflow with ReAct tools and Gemini 3.8 Flash.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
