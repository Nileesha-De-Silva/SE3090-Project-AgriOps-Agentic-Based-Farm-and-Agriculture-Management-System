class Farm {
  final String id;
  final String name;
  final String location;
  final double totalArea;
  final String ownerId;

  Farm({
    required this.id,
    required this.name,
    required this.location,
    required this.totalArea,
    required this.ownerId,
  });

  factory Farm.fromJson(Map<String, dynamic> json) {
    return Farm(
      id: json['id'],
      name: json['name'],
      location: json['location'],
      totalArea: (json['totalArea'] as num).toDouble(),
      ownerId: json['ownerId'],
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'name': name,
      'location': location,
      'totalArea': totalArea,
      'ownerId': ownerId,
    };
  }
}