import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/listing.dart';
import '../../providers/listings_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

class MyListingsScreen extends StatefulWidget {
  const MyListingsScreen({super.key});

  @override
  State<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends State<MyListingsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ListingsProvider>().fetchMyListings();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ListingsProvider>();

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        title: const Text('My Listings'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            onPressed: () => context.push('/create'),
          ),
        ],
      ),
      body: provider.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary))
          : provider.myListings.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.home_outlined,
                          size: 52, color: AppTheme.textLight),
                      const SizedBox(height: 16),
                      const Text("You haven't listed anything yet",
                          style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 6),
                      const Text('Tap + to add your first listing',
                          style: TextStyle(
                              fontSize: 14, color: AppTheme.textSecondary)),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () => context.push('/create'),
                        icon: const Icon(Icons.add),
                        label: const Text('List Your Place'),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.myListings.length,
                  itemBuilder: (_, i) => _MyListingTile(
                    listing: provider.myListings[i],
                    onEdit: () =>
                        context.push('/listings/${provider.myListings[i].id}/edit'),
                    onDelete: () => _confirmDelete(provider.myListings[i].id),
                    onStatusChange: () =>
                        _changeStatus(provider.myListings[i]),
                  ),
                ),
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Listing?'),
        content: const Text(
            'This will permanently delete your listing. This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success =
                  await context.read<ListingsProvider>().deleteMyListing(id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                      content: Text(success
                          ? 'Listing deleted'
                          : 'Failed to delete')),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _changeStatus(Listing listing) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Change Status',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            for (final status in ['active', 'pending', 'offMarket'])
              ListTile(
                leading: Icon(
                  status == 'active'
                      ? Icons.check_circle_rounded
                      : status == 'pending'
                          ? Icons.hourglass_empty_rounded
                          : Icons.block_rounded,
                  color: status == 'active'
                      ? const Color(0xFF34C759)
                      : status == 'pending'
                          ? const Color(0xFFFFCC00)
                          : const Color(0xFFFF3B30),
                ),
                title: Text(status == 'active'
                    ? 'Active'
                    : status == 'pending'
                        ? 'In Talks'
                        : 'Off Market'),
                selected: listing.status == status,
                onTap: () async {
                  Navigator.pop(context);
                  await context
                      .read<ListingsProvider>()
                      .updateListingStatus(listing.id, status);
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _MyListingTile extends StatelessWidget {
  final Listing listing;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onStatusChange;

  const _MyListingTile({
    required this.listing,
    required this.onEdit,
    required this.onDelete,
    required this.onStatusChange,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          GestureDetector(
            onTap: () => context.push('/listings/${listing.id}'),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius:
                      const BorderRadius.horizontal(left: Radius.circular(16)),
                  child: SizedBox(
                    width: 90,
                    height: 80,
                    child: listing.mainImage.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: listing.mainImage,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            color: AppTheme.divider,
                            child: const Icon(Icons.home_rounded,
                                color: AppTheme.textLight)),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          listing.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '\$${listing.price.toStringAsFixed(0)}/mo • ${listing.city}, ${listing.state}',
                          style: const TextStyle(
                              fontSize: 12, color: AppTheme.textSecondary),
                        ),
                        const SizedBox(height: 6),
                        GestureDetector(
                          onTap: onStatusChange,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: (listing.status == 'active'
                                  ? const Color(0xFF34C759)
                                  : listing.status == 'pending'
                                      ? const Color(0xFFFFCC00)
                                      : const Color(0xFFFF3B30)).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: (listing.status == 'active'
                                  ? const Color(0xFF34C759)
                                  : listing.status == 'pending'
                                      ? const Color(0xFFFFCC00)
                                      : const Color(0xFFFF3B30)).withValues(alpha: 0.4)),
                            ),
                            child: Row(mainAxisSize: MainAxisSize.min, children: [
                              Container(
                                width: 6, height: 6,
                                decoration: BoxDecoration(
                                  color: listing.status == 'active'
                                      ? const Color(0xFF34C759)
                                      : listing.status == 'pending'
                                          ? const Color(0xFFFFCC00)
                                          : const Color(0xFFFF3B30),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                listing.status == 'active' ? 'Available' : listing.status == 'pending' ? 'In Talks' : 'Off Market',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: listing.status == 'active'
                                      ? const Color(0xFF34C759)
                                      : listing.status == 'pending'
                                          ? const Color(0xFFFFCC00)
                                          : const Color(0xFFFF3B30),
                                ),
                              ),
                            ]),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Row(
            children: [
              Expanded(
                child: TextButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined, size: 14),
                  label: const Text('Edit'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.textSecondary,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              Container(width: 1, height: 20, color: AppTheme.border),
              Expanded(
                child: TextButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline_rounded, size: 14),
                  label: const Text('Delete'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.error,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
