import bcrypt from 'bcryptjs';
import supabaseConfig from '../config/supabase.js';
const { supabase, getCurrentUser, signOut } = supabaseConfig;

class User {
  constructor(userData) {
    this.id = userData.id;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.email = userData.email;
    this.username = userData.username;
    this.password = userData.password;
    this.orgPassword = userData.org_password;
    this.isPrimeConsultant = userData.is_prime_consultant;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  // Hash password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Create a new user
  static async create(userData) {
    const { email, username, password, firstName, lastName, orgPassword, isPrimeConsultant } = userData;
    
    // Hash password
    const hashedPassword = await this.hashPassword(password);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: email.toLowerCase().trim(),
          username: username.trim(),
          password: hashedPassword,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          org_password: orgPassword,
          is_prime_consultant: isPrimeConsultant || false
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new User(data);
  }

  // Find user by username
  static async findByUsername(username) {
    if (!username) {
      return null;
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data ? new User(data) : null;
  }



  // Find user by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data ? new User(data) : null;
  }

  // Check if email exists
  static async emailExists(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }

  // Check if username exists
  static async usernameExists(username) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }

  // Get user's entries
  async getEntries() {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', this.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  // Get user with their entries
  static async findByIdWithEntries(id) {
    // First get the user
    const user = await this.findById(id);
    if (!user) return null;

    // Then get their entries
    const entries = await user.getEntries();
    user.entries = entries;

    return user;
  }

  // Get entry count for user
  async getEntryCount() {
    const { data, error } = await supabase
      .from('entries')
      .select('id', { count: 'exact' })
      .eq('user_id', this.id);

    if (error) {
      throw error;
    }

    return data ? data.length : 0;
  }

  // Create an entry for this user
  async createEntry(entryData) {
    const { title, description, image } = entryData;
    
    const { data, error } = await supabase
      .from('entries')
      .insert([
        {
          user_id: this.id,
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

    return data;
  }

  // Instance method to compare password
  async comparePassword(candidatePassword) {
    return User.comparePassword(candidatePassword, this.password);
  }

  // Update user profile
  async update(updateData) {
    const allowedUpdates = ['first_name', 'last_name', 'email', 'username'];
    const updates = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('users')
      .update(updates)
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

  // Get user data without sensitive information
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      isPrimeConsultant: this.isPrimeConsultant,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      entries: this.entries || undefined
    };
  }

  // Get user data for public display (even less information)
  toPublicJSON() {
    return {
      id: this.id,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName
    };
  }
}

export default User;