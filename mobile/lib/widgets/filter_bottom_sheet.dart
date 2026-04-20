import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../models/listing_filters.dart';

class FilterBottomSheet extends StatefulWidget {
  final ListingFilters initialFilters;
  final Function(ListingFilters?) onApply;

  const FilterBottomSheet({
    super.key,
    required this.initialFilters,
    required this.onApply,
  });

  static void show(BuildContext context, {
    required ListingFilters initialFilters,
    required Function(ListingFilters?) onApply,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FilterBottomSheet(initialFilters: initialFilters, onApply: onApply),
    );
  }

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  late final _universityCtrl = TextEditingController(text: widget.initialFilters.university);
  late final _cityCtrl       = TextEditingController(text: widget.initialFilters.city);
  int? _bedrooms;

  @override
  void initState() {
    super.initState();
    _bedrooms = widget.initialFilters.bedrooms;
  }

  @override
  void dispose() {
    _universityCtrl.dispose();
    _cityCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          const Text('Filters', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.textPrimary)),
          const SizedBox(height: 20),
          TextField(
            controller: _universityCtrl,
            decoration: const InputDecoration(labelText: 'University', prefixIcon: Icon(Icons.school_outlined, size: 20)),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _cityCtrl,
            decoration: const InputDecoration(labelText: 'City', prefixIcon: Icon(Icons.location_city_outlined, size: 20)),
          ),
          const SizedBox(height: 16),
          const Text('Bedrooms', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
          const SizedBox(height: 8),
          Row(
            children: [null, 1, 2, 3, 4, 5].map((b) => Expanded(
              child: Padding(
                padding: const EdgeInsets.only(right: 4),
                child: GestureDetector(
                  onTap: () => setState(() => _bedrooms = b),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: _bedrooms == b ? AppTheme.primary : AppTheme.bgInput,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: _bedrooms == b ? AppTheme.primary : AppTheme.border),
                    ),
                    child: Center(
                      child: Text(
                        b == null ? 'Any' : '$b+',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _bedrooms == b ? Colors.white : AppTheme.textSecondary),
                      ),
                    ),
                  ),
                ),
              ),
            )).toList(),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    widget.onApply(null);
                    Navigator.pop(context);
                  },
                  child: const Text('Clear'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    widget.onApply(ListingFilters(
                      university: _universityCtrl.text.isEmpty ? null : _universityCtrl.text,
                      city:       _cityCtrl.text.isEmpty ? null : _cityCtrl.text,
                      bedrooms:   _bedrooms,
                    ));
                    Navigator.pop(context);
                  },
                  child: const Text('Apply'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
