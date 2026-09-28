import 'package:flutter/material.dart';
import '../api/component1_api.dart';
import '../models/farm.dart';
import '../models/field.dart';
import 'field_dashboard_screen.dart';

class FarmDetailScreen extends StatefulWidget {
  final Farm farm;

  const FarmDetailScreen({super.key, required this.farm});

  @override
  State<FarmDetailScreen> createState() => _FarmDetailScreenState();
}

class _FarmDetailScreenState extends State<FarmDetailScreen> {
  List<Field> _fields = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFields();
  }

  Future<void> _loadFields() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final fields = await Component1Api.getFields(farmId: widget.farm.id);
      setState(() {
        _fields = fields;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _showCreateFieldDialog() {
    final nameController = TextEditingController();
    final areaController = TextEditingController();
    final soilController = TextEditingController();
    final coordinatesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New Field'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Field Name'),
              ),
              TextField(
                controller: areaController,
                decoration: const InputDecoration(labelText: 'Area Size (acres)'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: soilController,
                decoration: const InputDecoration(labelText: 'Soil Type'),
              ),
              TextField(
                controller: coordinatesController,
                decoration: const InputDecoration(
                  labelText: 'Boundary Coordinates (optional)',
                  hintText: 'lat,lng',
                ),
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
              try {
                await Component1Api.createField(Field(
                  id: '',
                  farmId: widget.farm.id,
                  fieldName: nameController.text,
                  areaSize: double.tryParse(areaController.text) ?? 0,
                  soilType: soilController.text,
                  boundaryCoordinates: coordinatesController.text.isEmpty
                      ? null
                      : coordinatesController.text,
                ));
                if (context.mounted) Navigator.pop(context);
                _loadFields();
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString())),
                  );
                }
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.farm.name)),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateFieldDialog,
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: _loadFields,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                '${widget.farm.location} — ${widget.farm.totalArea} acres',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _error != null
                      ? Center(child: Text('Error: $_error'))
                      : _fields.isEmpty
                          ? const Center(child: Text('No fields yet — tap + to add one.'))
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              itemCount: _fields.length,
                              itemBuilder: (context, index) {
                                final field = _fields[index];
                                return Card(
                                  child: ListTile(
                                    title: Text(field.fieldName),
                                    subtitle: Text('${field.areaSize} acres — ${field.soilType}'),
                                    trailing: const Icon(Icons.chevron_right),
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => FieldDashboardScreen(field: field),
                                        ),
                                      );
                                    },
                                  ),
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }
}