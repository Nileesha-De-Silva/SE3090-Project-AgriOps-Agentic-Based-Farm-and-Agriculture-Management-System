import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { runAgentAnalysis, clearActiveResult } from '../../store/slices/cropAnalysisSlice';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  MapPin, 
  Flame, 
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
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI Crop Analysis Sandbox
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Gemini 3.8 Flash
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Submit field observations to Agent 2 to execute ReAct handbook lookup, self-correcting query grading, and risk gating.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">New Crop Observation</h3>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => handleQuickFill('critical_pest')}
                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100"
                title="Fill with Critical Pest observation"
              >
                Pest Preset
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('routine')}
                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                title="Fill with Routine observation"
              >
                Routine
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Field Plot ID</label>
                <input
                  type="text"
                  required
                  value={formData.fieldId}
                  onChange={(e) => setFormData({ ...formData, fieldId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Crop Variety</label>
                <input
                  type="text"
                  required
                  value={formData.cropVariety}
                  onChange={(e) => setFormData({ ...formData, cropVariety: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Growth Stage</label>
              <select
                value={formData.growthStage}
                onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Seedling">Seedling</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Flowering">Flowering</option>
                <option value="Fruiting">Fruiting</option>
                <option value="Maturation">Maturation</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Visual Observation & Symptoms *</label>
              <textarea
                rows="4"
                required
                placeholder="Describe leaf discolorations, pest markings, or physical stress..."
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all ${
                isAnalyzing
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              
              {/* Result Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Execution Status:</span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      activeAnalysisResult.status === 'awaiting_approval'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {activeAnalysisResult.status === 'awaiting_approval'
                      ? '⏸ Awaiting Manager Approval'
                      : '✅ Completed'}
                  </span>
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  Tokens: {activeAnalysisResult.total_tokens || 312}
                </span>
              </div>

              {/* Node Trajectory Path */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>LangGraph Trajectory Path</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  {activeAnalysisResult.nodes?.map((node, index) => (
                    <React.Fragment key={node}>
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 shadow-2xs">
                        {node}
                      </span>
                      {index < activeAnalysisResult.nodes.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      )}
                    </React.Fragment>
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Grounded Diagnostic Synthesis</span>
                  </label>
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {activeAnalysisResult.answer}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Agent 2 Ready</h3>
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
