import 'package:flutter/material.dart';
import '../api/task_api.dart';
import '../api/component1_api.dart';
import '../models/farm_task.dart';
import '../models/field.dart';
import '../widgets/app_theme.dart';
import 'task_evidence_upload_screen.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  List<FarmTask> _tasks = [];
  bool _loading = true;
  String? _error;
  String _selectedStatus = 'All';

  final List<String> _statusFilters = ['All', 'Pending', 'InProgress', 'Completed', 'Verified'];

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final statusParam = _selectedStatus == 'All' ? null : _selectedStatus;
      final tasks = await TaskApi.getTasks(status: statusParam);
      setState(() {
        _tasks = tasks;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'critical':
        return Colors.red.shade700;
      case 'high':
        return Colors.orange.shade800;
      case 'medium':
        return Colors.amber.shade800;
      case 'low':
      default:
        return Colors.blue.shade700;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.blueGrey;
      case 'inprogress':
        return Colors.blue;
      case 'completed':
        return Colors.orange;
      case 'verified':
        return AppTheme.primaryGreen;
      default:
        return Colors.grey;
    }
  }

  Future<void> _showCreateTaskDialog() async {
    List<Field> fields = [];
    try {
      fields = await Component1Api.getFields();
    } catch (_) {}

    if (!mounted) return;

    final descriptionController = TextEditingController();
    String selectedTaskType = 'Irrigation';
    String selectedPriority = 'Medium';
    String? selectedFieldId = fields.isNotEmpty ? fields.first.id : null;
    DateTime selectedTargetDate = DateTime.now().add(const Duration(days: 1));

    final taskTypes = ['Irrigation', 'Fertilization', 'PestControl', 'Planting', 'Harvest', 'Scouting', 'SoilSampling', 'Pruning'];
    final priorities = ['Low', 'Medium', 'High', 'Critical'];

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Create Farm Task'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (fields.isNotEmpty) ...[
                  const Text('Field', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  DropdownButton<String>(
                    isExpanded: true,
                    value: selectedFieldId,
                    items: fields.map((f) => DropdownMenuItem(
                      value: f.id,
                      child: Text('${f.fieldName} (${f.areaSize} ac)'),
                    )).toList(),
                    onChanged: (val) => setDialogState(() => selectedFieldId = val),
                  ),
                  const SizedBox(height: 12),
                ],
                const Text('Task Type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                DropdownButton<String>(
                  isExpanded: true,
                  value: selectedTaskType,
                  items: taskTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                  onChanged: (val) => setDialogState(() => selectedTaskType = val ?? selectedTaskType),
                ),
                const SizedBox(height: 12),
                const Text('Priority', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                DropdownButton<String>(
                  isExpanded: true,
                  value: selectedPriority,
                  items: priorities.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                  onChanged: (val) => setDialogState(() => selectedPriority = val ?? selectedPriority),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descriptionController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Task Description',
                    hintText: 'e.g. Inspect drip line pressure and flush filters',
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Target Date: ${selectedTargetDate.toLocal().toString().split(' ')[0]}'),
                    TextButton(
                      child: const Text('Change Date'),
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: selectedTargetDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (picked != null) {
                          setDialogState(() => selectedTargetDate = picked);
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (selectedFieldId == null && fields.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please create at least one farm and field first!')),
                  );
                  return;
                }
                try {
                  await TaskApi.createTask(
                    fieldId: selectedFieldId ?? '',
                    taskType: selectedTaskType,
                    priority: selectedPriority,
                    description: descriptionController.text.trim().isEmpty
                        ? '$selectedTaskType operation'
                        : descriptionController.text.trim(),
                    targetDate: selectedTargetDate,
                  );
                  if (context.mounted) {
                    Navigator.pop(context);
                    _loadTasks();
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _startTask(FarmTask task) async {
    try {
      await TaskApi.updateTaskStatus(task.id, 'InProgress', remarks: 'Work started by field worker');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.blue,
          content: Text('Task status changed to InProgress!'),
        ),
      );
      _loadTasks();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _showVerificationDialog(FarmTask task) async {
    final remarksController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Manager Verification'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Verify task: "${task.taskType} - ${task.description}"'),
            const SizedBox(height: 12),
            TextField(
              controller: remarksController,
              decoration: const InputDecoration(
                labelText: 'Manager Notes',
                hintText: 'e.g. Work quality confirmed in field inspection',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () async {
              try {
                await TaskApi.verifyEvidence(
                  task.id,
                  isApproved: false,
                  remarks: remarksController.text.isEmpty ? 'Rejected by manager' : remarksController.text,
                );
                if (context.mounted) {
                  Navigator.pop(context);
                  _loadTasks();
                }
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            child: const Text('Reject'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
            onPressed: () async {
              try {
                await TaskApi.verifyEvidence(
                  task.id,
                  isApproved: true,
                  remarks: remarksController.text.isEmpty ? 'Approved by manager' : remarksController.text,
                );
                if (context.mounted) {
                  Navigator.pop(context);
                  _loadTasks();
                }
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            child: const Text('Approve & Verify'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Farm Operations & Tasks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTasks,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateTaskDialog,
        icon: const Icon(Icons.add_task),
        label: const Text('New Task'),
      ),
      body: Column(
        children: [
          // Filter horizontal list
          Container(
            height: 48,
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _statusFilters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final status = _statusFilters[index];
                final isSelected = _selectedStatus == status;
                return ChoiceChip(
                  label: Text(status),
                  selected: isSelected,
                  selectedColor: AppTheme.lightGreen,
                  labelStyle: TextStyle(
                    color: isSelected ? AppTheme.primaryGreen : Colors.black87,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => _selectedStatus = status);
                      _loadTasks();
                    }
                  },
                );
              },
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadTasks,
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.error_outline, size: 48, color: Colors.red),
                                const SizedBox(height: 12),
                                Text('Failed to load tasks\n$_error', textAlign: TextAlign.center),
                                const SizedBox(height: 16),
                                ElevatedButton(onPressed: _loadTasks, child: const Text('Retry')),
                              ],
                            ),
                          ),
                        )
                      : _tasks.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.assignment_turned_in, size: 56, color: Colors.grey.shade400),
                                  const SizedBox(height: 12),
                                  Text(
                                    _selectedStatus == 'All'
                                        ? 'No tasks found. Tap + New Task to create one.'
                                        : 'No tasks with status "$_selectedStatus".',
                                    style: TextStyle(color: Colors.grey.shade600),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(12, 4, 12, 80),
                              itemCount: _tasks.length,
                              itemBuilder: (context, index) {
                                final task = _tasks[index];
                                final isPending = task.status.toLowerCase() == 'pending';
                                final isInProgress = task.status.toLowerCase() == 'inprogress';
                                final isCompleted = task.status.toLowerCase() == 'completed';
                                final isVerified = task.status.toLowerCase() == 'verified';

                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  child: Padding(
                                    padding: const EdgeInsets.all(14),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              task.taskType,
                                              style: const TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                                  decoration: BoxDecoration(
                                                    color: _getPriorityColor(task.priority).withOpacity(0.12),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    task.priority,
                                                    style: TextStyle(
                                                      color: _getPriorityColor(task.priority),
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 11,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                  decoration: BoxDecoration(
                                                    color: _getStatusColor(task.status).withOpacity(0.12),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    task.status,
                                                    style: TextStyle(
                                                      color: _getStatusColor(task.status),
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 11,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          task.description,
                                          style: TextStyle(color: Colors.grey.shade800, fontSize: 14),
                                        ),
                                        const SizedBox(height: 10),
                                        Row(
                                          children: [
                                            Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade600),
                                            const SizedBox(width: 4),
                                            Text(
                                              'Due: ${task.targetDate.split('T')[0]}',
                                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                            ),
                                            if (task.assignments.isNotEmpty) ...[
                                              const SizedBox(width: 16),
                                              Icon(Icons.person_outline, size: 14, color: Colors.grey.shade600),
                                              const SizedBox(width: 4),
                                              Text(
                                                task.assignments.first.workerName ?? 'Assigned Worker',
                                                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                              ),
                                            ],
                                          ],
                                        ),
                                        const Divider(height: 20),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            if (isPending)
                                              OutlinedButton.icon(
                                                icon: const Icon(Icons.play_arrow, size: 16),
                                                label: const Text('Start Work'),
                                                onPressed: () => _startTask(task),
                                              ),
                                            if (isInProgress)
                                              ElevatedButton.icon(
                                                icon: const Icon(Icons.camera_alt, size: 16),
                                                label: const Text('Submit Evidence'),
                                                onPressed: () async {
                                                  final updated = await Navigator.push(
                                                    context,
                                                    MaterialPageRoute(
                                                      builder: (context) => TaskEvidenceUploadScreen(task: task),
                                                    ),
                                                  );
                                                  if (updated == true) _loadTasks();
                                                },
                                              ),
                                            if (isCompleted)
                                              ElevatedButton.icon(
                                                style: ElevatedButton.styleFrom(backgroundColor: Colors.amber.shade800),
                                                icon: const Icon(Icons.verified_user, size: 16),
                                                label: const Text('Verify Work'),
                                                onPressed: () => _showVerificationDialog(task),
                                              ),
                                            if (isVerified)
                                              const Chip(
                                                avatar: Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 18),
                                                label: Text('Verified & Closed'),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
            ),
          ),
        ],
      ),
    );
  }
}
