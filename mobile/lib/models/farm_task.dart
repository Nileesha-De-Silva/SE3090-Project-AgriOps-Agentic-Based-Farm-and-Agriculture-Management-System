class TaskAssignment {
  final String id;
  final String taskId;
  final String workerId;
  final String? workerName;
  final String assignedDate;
  final String status;

  TaskAssignment({
    required this.id,
    required this.taskId,
    required this.workerId,
    this.workerName,
    required this.assignedDate,
    required this.status,
  });

  factory TaskAssignment.fromJson(Map<String, dynamic> json) {
    return TaskAssignment(
      id: json['id']?.toString() ?? '',
      taskId: json['taskId']?.toString() ?? '',
      workerId: json['workerId']?.toString() ?? '',
      workerName: json['workerName']?.toString(),
      assignedDate: json['assignedDate']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
    );
  }
}

class FarmTask {
  final String id;
  final String fieldId;
  final String? cropSeasonId;
  final String taskType;
  final String priority;
  final String description;
  final String targetDate;
  final String status;
  final String createdAt;
  final String? updatedAt;
  final List<TaskAssignment> assignments;

  FarmTask({
    required this.id,
    required this.fieldId,
    this.cropSeasonId,
    required this.taskType,
    required this.priority,
    required this.description,
    required this.targetDate,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    required this.assignments,
  });

  factory FarmTask.fromJson(Map<String, dynamic> json) {
    var rawAssignments = json['assignments'] as List<dynamic>? ?? [];
    return FarmTask(
      id: json['id']?.toString() ?? '',
      fieldId: json['fieldId']?.toString() ?? '',
      cropSeasonId: json['cropSeasonId']?.toString(),
      taskType: json['taskType']?.toString() ?? 'General',
      priority: json['priority']?.toString() ?? 'Medium',
      description: json['description']?.toString() ?? '',
      targetDate: json['targetDate']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Pending',
      createdAt: json['createdAt']?.toString() ?? '',
      updatedAt: json['updatedAt']?.toString(),
      assignments: rawAssignments
          .map((a) => TaskAssignment.fromJson(a as Map<String, dynamic>))
          .toList(),
    );
  }
}

class TaskHistoryItem {
  final String id;
  final String taskId;
  final String previousStatus;
  final String newStatus;
  final String? remarks;
  final String? evidencePhotoUrl;
  final String timestamp;

  TaskHistoryItem({
    required this.id,
    required this.taskId,
    required this.previousStatus,
    required this.newStatus,
    this.remarks,
    this.evidencePhotoUrl,
    required this.timestamp,
  });

  factory TaskHistoryItem.fromJson(Map<String, dynamic> json) {
    return TaskHistoryItem(
      id: json['id']?.toString() ?? '',
      taskId: json['taskId']?.toString() ?? '',
      previousStatus: json['previousStatus']?.toString() ?? '',
      newStatus: json['newStatus']?.toString() ?? '',
      remarks: json['remarks']?.toString(),
      evidencePhotoUrl: json['evidencePhotoUrl']?.toString(),
      timestamp: json['timestamp']?.toString() ?? '',
    );
  }
}
