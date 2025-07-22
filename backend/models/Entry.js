import supabaseConfig from '../config/supabase.js';
const { supabase, getCurrentUser, signOut } = supabaseConfig;

class Entry {
  constructor(entryData) {
    this.id = entryData.id;
    this.title = entryData.title;
    this.description = entryData.description;
    this.image = entryData.image
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }


  // Create a new user
  static async create(entryData) {
    const { title, description, image } = entryData;
    
    // Hash password
    
    const { data, error } = await supabase
      .from('entries')
      .insert([
        {
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

  // Find user by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? new Entry(data) : null;
  }

  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data ? data.map(entry => new Entry(entry)) : [];
  }
  async update(updateData) {
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
  async delete() {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', this.id);

    if (error) {
      throw error;
    }

    return true;
  }
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      image: this.image,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Entry