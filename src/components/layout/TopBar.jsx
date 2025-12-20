import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, ChevronDown, User, LogOut, AlertCircle, Users, MapPin, Tag, FileText, Loader2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { searchService } from '../../services/searchService';

export const TopBar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceTimer = useRef(null);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await searchService.globalSearch(searchQuery.trim());
        setSearchResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults({ issues: [], users: [], locations: [], tags: [], notifications: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (type, item) => {
    setShowResults(false);
    setSearchQuery('');
    
    switch (type) {
      case 'issues':
        navigate(`${ROUTES.ISSUES}/${item.id}`);
        break;
      case 'users':
        navigate(`${ROUTES.USERS}`);
        break;
      case 'locations':
        navigate(ROUTES.LOCATIONS);
        break;
      case 'tags':
        navigate(ROUTES.TAGS);
        break;
      case 'notifications':
        navigate(ROUTES.NOTIFICATIONS);
        break;
      default:
        break;
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'issues': return <AlertCircle size={16} className="text-blue-500" />;
      case 'users': return <Users size={16} className="text-green-500" />;
      case 'locations': return <MapPin size={16} className="text-purple-500" />;
      case 'tags': return <Tag size={16} className="text-orange-500" />;
      case 'notifications': return <Bell size={16} className="text-yellow-500" />;
      default: return <FileText size={16} className="text-gray-500" />;
    }
  };

  const getResultTitle = (type, item) => {
    switch (type) {
      case 'issues': return item.title || 'Untitled Issue';
      case 'users': return item.fullName || item.email || 'Unknown User';
      case 'locations': return item.name || 'Unknown Location';
      case 'tags': return item.name || 'Unknown Tag';
      case 'notifications': return item.subject || item.message || 'Notification';
      default: return 'Unknown';
    }
  };

  const getResultSubtitle = (type, item) => {
    switch (type) {
      case 'issues': return item.category || item.status || '';
      case 'users': return item.email || item.role || '';
      case 'locations': return item.type || '';
      case 'tags': return item.description || '';
      case 'notifications': return item.message?.substring(0, 50) || '';
      default: return '';
    }
  };

  const totalResults = searchResults ? 
    Object.values(searchResults).reduce((sum, arr) => sum + (arr?.length || 0), 0) : 0;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Global Search */}
          <div className="relative w-96 hidden md:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search issues, users, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  setShowResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && searchQuery.trim().length >= 2 && (
              <div
                ref={resultsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
              >
                {isSearching ? (
                  <div className="p-6 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Searching...</p>
                  </div>
                ) : searchResults && totalResults > 0 ? (
                  <div className="py-2">
                    {Object.entries(searchResults).map(([type, items]) => {
                      if (!items || items.length === 0) return null;
                      
                      const typeLabels = {
                        issues: 'Issues',
                        users: 'Users',
                        locations: 'Locations',
                        tags: 'Tags',
                        notifications: 'Notifications'
                      };

                      return (
                        <div key={type} className="mb-2">
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                              {typeLabels[type]} ({items.length})
                            </h3>
                          </div>
                          {items.slice(0, 5).map((item, index) => (
                            <button
                              key={item.id || index}
                              onClick={() => handleResultClick(type, item)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-start gap-3">
                                {getResultIcon(type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {getResultTitle(type, item)}
                                  </p>
                                  {getResultSubtitle(type, item) && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                      {getResultSubtitle(type, item)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                          {items.length > 5 && (
                            <button
                              onClick={() => {
                                setShowResults(false);
                                setSearchQuery('');
                                // Navigate to the relevant page
                                const routeMap = {
                                  issues: ROUTES.ISSUES,
                                  users: ROUTES.USERS,
                                  locations: ROUTES.LOCATIONS,
                                  tags: ROUTES.TAGS,
                                  notifications: ROUTES.NOTIFICATIONS
                                };
                                navigate(routeMap[type] || ROUTES.DASHBOARD);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
                            >
                              View all {items.length} {typeLabels[type].toLowerCase()}...
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Search size={24} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button 
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block font-medium">
                {user?.fullName || 'User'}
              </span>
              <ChevronDown size={16} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <button 
                    onClick={() => {
                      navigate(ROUTES.PROFILE);
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};