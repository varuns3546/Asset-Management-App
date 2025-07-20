const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.username = userData.username;
    this.password = userData.password;
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
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
    const { email, username, password, firstName, lastName } = userData;
    
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
          last_name: lastName.trim()
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new User(data);
  }

  // Find user by email or username
  static async findByEmailOrUsername(identifier) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${identifier.toLowerCase()},username.eq.${identifier}`)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
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

  // Instance method to compare password
  async comparePassword(candidatePassword) {
    return User.comparePassword(candidatePassword, this.password);
  }

  // Get user data without password
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;