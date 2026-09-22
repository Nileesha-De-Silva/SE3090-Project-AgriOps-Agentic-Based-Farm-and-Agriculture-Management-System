import 'package:flutter/material.dart';
import '../api/component1_api.dart';
import '../models/farm.dart';
import 'farm_detail_screen.dart';

class FarmsScreen extends StatefulWidget {
  const FarmsScreen({super.key});

  @override
  State<FarmsScreen> createState() => _FarmsScreenState();
}

class _FarmsScreenState extends State<FarmsScreen> {
  List<Farm> _farms = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFarms();
  }

  Future<void> _loadFarms() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final farms = await Component1Api.getFarms();
      setState(() {
        _farms = farms;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _showCreateFarmDialog() {
    final nameController = TextEditingController();
    final locationController = TextEditingController();
    final areaController = TextEditingController();
    final ownerIdController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('New Farm'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              TextField(
                controller: locationController,
                decoration: const InputDecoration(labelText: 'Location'),
              ),
              TextField(
                controller: areaController,
                decoration: const InputDecoration(labelText: 'Total Area (acres)'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: ownerIdController,
                decoration: const InputDecoration(
                  labelText: 'Owner ID',
                  helperText: 'temporary until auth exists',
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
                await Component1Api.createFarm(Farm(
                  id: '',
                  name: nameController.text,
                  location: locationController.text,
                  totalArea: double.tryParse(areaController.text) ?? 0,
                  ownerId: ownerIdController.text,
                ));
                if (context.mounted) Navigator.pop(context);
                _loadFarms();
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
      appBar: AppBar(title: const Text('Farms')),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateFarmDialog,
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: _loadFarms,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text('Error: $_error'))
                : _farms.isEmpty
                    ? const Center(child: Text('No farms yet — tap + to add one.'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _farms.length,
                        itemBuilder: (context, index) {
                          final farm = _farms[index];
                          return Card(
                            child: ListTile(
                              title: Text(farm.name),
                              subtitle: Text('${farm.location} — ${farm.totalArea} acres'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => FarmDetailScreen(farm: farm),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}