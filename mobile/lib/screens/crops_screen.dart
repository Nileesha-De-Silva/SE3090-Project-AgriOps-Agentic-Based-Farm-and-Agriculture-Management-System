import 'package:flutter/material.dart';
import '../api/component1_api.dart';
import '../models/crop.dart';

class CropsScreen extends StatefulWidget {
  const CropsScreen({super.key});

  @override
  State<CropsScreen> createState() => _CropsScreenState();
}

class _CropsScreenState extends State<CropsScreen> {
  List<Crop> _crops = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCrops();
  }

  Future<void> _loadCrops() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final crops = await Component1Api.getCrops();
      setState(() {
        _crops = crops;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Crop Catalog')),
      body: RefreshIndicator(
        onRefresh: _loadCrops,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(child: Text('Error: $_error'))
                : _crops.isEmpty
                    ? const Center(child: Text('No crops available yet.'))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _crops.length,
                        itemBuilder: (context, index) {
                          final crop = _crops[index];
                          return Card(
                            child: ListTile(
                              title: Text('${crop.cropName} (${crop.variety})'),
                              subtitle: Text('${crop.optimalGrowthDurationDays} days to maturity'),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}