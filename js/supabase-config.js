class SupabaseService {
  constructor() {
    this.client = supabase.createClient(
      'https://vxoymuhbotxjqwjftahx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4b3ltdWhib3R4anF3amZ0YWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDUzMTEsImV4cCI6MjA2MDQyMTMxMX0.PuaMD3BYIPe9qV35--2VPwEklXT50rbV4XFVWzipjUU'
    );
  }

  async signIn(email, password) {
    return await this.client.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return await this.client.auth.signOut();
  }

  async createWorker(email, password, fullName, workerType) {
    const { data: authData, error: authError } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          worker_type: workerType
        }
      }
    });
    
    if (authError) throw authError;

    const { error: dbError } = await this.client
      .from('workers')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        worker_type: workerType,
        created_at: new Date().toISOString()
      });

    if (dbError) throw dbError;

    return authData.user;
  }

  async getOrders(page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    return await this.client
      .from('orders')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });
  }

  async getOrderDetails(orderId) {
    return await this.client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
  }

  async updateOrderStatus(orderId, status) {
    return await this.client
      .from('orders')
      .update({ status })
      .eq('id', orderId);
  }

  async getWorkers() {
    const { data, error } = await this.client
      .from('workers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getProducts() {
    return await this.client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
  }

  async createProduct(productData) {
    return await this.client
      .from('products')
      .insert([productData]);
  }

  async updateProduct(id, productData) {
    return await this.client
      .from('products')
      .update(productData)
      .eq('id', id);
  }

  async deleteProduct(id) {
    return await this.client
      .from('products')
      .delete()
      .eq('id', id);
  }

  async uploadProductImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await this.client.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = this.client.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async deleteWorker(workerId) {
    const { error } = await this.client
      .from('workers')
      .delete()
      .eq('id', workerId);

    if (error) throw error;
  }
}
