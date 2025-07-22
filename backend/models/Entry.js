import supabaseConfig from '../config/supabase.js';
const { supabase, getCurrentUser, signOut } = supabaseConfig;

class Entry {
  constructor(entryData) {
    this.userId = entryData.userId;
    this.userId = entryData.userId;
    this.title = entryData.title;
    this.description = entryData.description;
    this.image = entryData.image;
    this.createdAt = entryData.created_at;
    this.updatedAt = entryData.updated_at;
  }

  // Create a new entry for a specific user
  static async create(entryData, userId) {
    const { title, description, image } = entryData;
    
    if (!userId) {
      throw new Error('User ID is required to create an entry');
    }
    
    const { data, error } = await supabase
      .from('entries')
      .insert([
        {
          userId: userId,
          title: title,
          description: description,
          image: image
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Entry(data);
  }

  // Find entry by ID (with optional user verification)
  static async findById(id, userId = null) {
    let query = supabase
      .from('entries')
      .select('*')
      .eq('id', id);

    // If userId is provided, ensure the entry belongs to that user
    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? new Entry(data) : null;
  }

  // Find all entries (optionally filtered by user)
  static async findAll(userId = null) {
    let query = supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false });

    // If userId is provided, only get entries for that user
    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data ? data.map(entry => new Entry(entry)) : [];
  }

  // Find all entries for a specific user
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('userId', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data ? data.map(entry => new Entry(entry)) : [];
  }

  // Update entry (with user verification)
  async update(updateData, userId = null) {
    // If userId is provided, verify ownership
    if (userId && this.userId !== userId) {
      throw new Error('Unauthorized: You can only update your own entries');
    }

    const { data, error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', this.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update current instance
    Object.assign(this, data);
    return this;
  }

  // Delete entry (with user verification)
  async delete(userId = null) {
    // If userId is provided, verify ownership
    if (userId && this.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own entries');
    }

    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', this.id);

    if (error) {
      throw error;
    }

    return true;
  }

  // Check if entry belongs to user
  belongsToUser(userId) {
    return this.userId === userId;
  }

  // Get entry data with user information
  static async findByIdWithUser(id) {
    const { data, error } = await supabase
      .from('entries')
      .select(`
        *,
        users (
          id,
          username,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return null;

    const entry = new Entry(data);
    entry.user = data.users;
    return entry;
  }

  // Get all entries with user information
  static async findAllWithUsers(userId = null) {
    let query = supabase
      .from('entries')
      .select(`
        *,
        users (
          id,
          username,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data ? data.map(entryData => {
      const entry = new Entry(entryData);
      entry.user = entryData.users;
      return entry;
    }) : [];
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      image: this.image,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      user: this.user || undefined
    };
  }
}

export default Entry;