import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../models/user.dart';
import '../models/listing.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final _api = ApiService();

  User?          _user             = null;
  bool           _isLoading        = false;
  List<Listing>  _favoriteListings = [];

  User?         get user             => _user;
  bool          get isLoading        => _isLoading;
  bool          get isAuthenticated  => _user != null;
  bool          get isAdmin          => _user?.isAdmin ?? false;
  List<Listing> get favoriteListings => _favoriteListings;

  Future<void> tryRestoreSession() async {
    final token = await _api.getToken();
    if (token == null) return;
    try {
      final res = await _api.get('/auth/me');
      final userData = res.data['data'] as Map<String, dynamic>;
      _user = User.fromJson(userData);
      _favoriteListings = _parseFavoriteListings(userData['favorites']);
      notifyListeners();
    } catch (_) {
      await _api.clearToken();
    }
  }

  Future<String?> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await _api.post('/auth/login', data: {'email': email, 'password': password});
      final data = res.data['data'];
      await _api.saveToken(data['token']);
      _user = User.fromJson(data['user']);
      // After login, fetch /auth/me to get populated favorites
      try {
        final meRes = await _api.get('/auth/me');
        final userData = meRes.data['data'] as Map<String, dynamic>;
        _favoriteListings = _parseFavoriteListings(userData['favorites']);
      } catch (_) {}
      return null;
    } on DioException catch (e) {
      return e.response?.data?['message'] ?? 'Login failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> register({required String name, required String email, required String password}) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.post('/auth/register', data: {'name': name, 'email': email, 'password': password});
      return null;
    } on DioException catch (e) {
      return e.response?.data?['message'] ?? 'Registration failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> forgotPassword(String email) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.post('/auth/forgot-password', data: {'email': email});
      return null;
    } on DioException catch (e) {
      return e.response?.data?['message'] ?? 'Request failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> resendVerification(String email) async {
    await _api.post('/auth/resend-verification', data: {'email': email});
  }

  List<Listing> _parseFavoriteListings(dynamic raw) {
    if (raw == null) return [];
    return (raw as List).whereType<Map>().map((f) => Listing.fromJson(f as Map<String, dynamic>)).toList();
  }

  bool isFavorited(String listingId) => _user?.favorites.contains(listingId) ?? false;

  Future<void> toggleFavorite(String listingId) async {
    if (_user == null) return;
    final favs = List<String>.from(_user!.favorites);
    final wasAdding = !favs.contains(listingId);
    if (wasAdding) {
      favs.add(listingId);
    } else {
      favs.remove(listingId);
    }
    _user = _user!.copyWith(favorites: favs);
    notifyListeners();
    try {
      await _api.post('/listings/$listingId/favorite');
      // Refresh favorites list from server to get full listing objects
      final meRes = await _api.get('/auth/me');
      final userData = meRes.data['data'] as Map<String, dynamic>;
      _favoriteListings = _parseFavoriteListings(userData['favorites']);
      notifyListeners();
    } catch (_) {
      // revert
      final orig = List<String>.from(_user!.favorites);
      if (orig.contains(listingId)) orig.remove(listingId); else orig.add(listingId);
      _user = _user!.copyWith(favorites: orig);
      notifyListeners();
    }
  }

  void updateFavorites(List<String> favorites) {
    if (_user != null) {
      _user = _user!.copyWith(favorites: favorites);
      notifyListeners();
    }
  }

  Future<String?> updateName(String name) async {
    if (_user == null) return 'Not logged in';
    try {
      final res = await _api.put('/auth/me', data: {'name': name});
      final updated = User.fromJson(res.data['data']['user'] ?? res.data['data']);
      _user = updated;
      notifyListeners();
      return null;
    } on DioException catch (e) {
      return e.response?.data?['message'] ?? 'Failed to save name';
    } catch (e) {
      return e.toString();
    }
  }

  void updateAvatar(String avatarKey) {
    if (_user == null) return;
    _user = _user!.copyWith(avatarKey: avatarKey);
    notifyListeners();
  }

  Future<void> logout() async {
    await _api.clearToken();
    _user = null;
    _favoriteListings = [];
    notifyListeners();
  }
}
