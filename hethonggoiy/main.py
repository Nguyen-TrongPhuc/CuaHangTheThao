import pandas as pd
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Cho phép Frontend (Vue.js) ở port khác gọi API

# Khởi tạo biến toàn cục để API luôn có thể gọi được kể cả khi DB lỗi


# 1. Thiết lập kết nối MongoDB
# Sử dụng 127.0.0.1 thay cho localhost để tránh một số lỗi phân giải DNS IPv6 trên máy cục bộ
connection_string = "mongodb://127.0.0.1:27017/" 

try:
    # Khởi tạo kết nối
    client = MongoClient(connection_string)
    
    # Chọn Database của dự án SportStore
    db = client['SportStore']
    
    # Chọn Collection chứa các sản phẩm thể thao
    collection = db['products'] 
    
    # Lấy toàn bộ dữ liệu từ MongoDB và chuyển thành danh sách (List)
    cursor = collection.find()
    data = list(cursor)
    
    # Chuyển đổi sang Pandas DataFrame để xử lý AI
    df_sanpham = pd.DataFrame(data)

    if not df_sanpham.empty:
        # Chuyển cột _id từ kiểu ObjectId của MongoDB sang chuỗi (string) để dễ so sánh
        df_sanpham['_id'] = df_sanpham['_id'].astype(str)

        print("Kết nối thành công tới Database của SportStore!")
        # Hiển thị thử 5 sản phẩm đầu tiên để kiểm tra cột (dùng name và price theo schema)
        print(df_sanpham[['_id', 'name', 'price']].head()) 

        # 2. Tiền xử lý dữ liệu
        def combineFeatures(row):
            # Lấy dữ liệu theo đúng tên cột trong MongoDB của SportStore
            gia = str(row.get('price', '0'))
            mo_ta = str(row.get('description', ''))
            ten = str(row.get('name', ''))
            
            # Kết hợp các đặc trưng lại thành một chuỗi văn bản dài
            return ten + " " + gia + " " + mo_ta

        # Áp dụng hàm combineFeatures cho từng dòng trong DataFrame
        df_sanpham['combinedFeatures'] = df_sanpham.apply(combineFeatures, axis=1)

        # Viết thường tất cả các ký tự để mô hình AI dễ học và so sánh hơn
        df_sanpham['combinedFeatures'] = df_sanpham['combinedFeatures'].str.lower()

        print("\n--- Dữ liệu đã gộp ---")
        print(df_sanpham['combinedFeatures'].head())

        # 3. Tính toán độ tương đồng (Recommendation Engine)
        # Khởi tạo TF-IDF để biến văn bản thành vector số
        tf = TfidfVectorizer()
        tfMatrix = tf.fit_transform(df_sanpham['combinedFeatures'])

        # Tính toán ma trận tương đồng Cosine
        similar = cosine_similarity(tfMatrix)

    else:
        print("Cảnh báo: Không tìm thấy sản phẩm nào trong Collection.")

except Exception as e:
    print(f"Lỗi kết nối: {e}")

# 4. Hàm lấy thông tin chi tiết sản phẩm để UI có thể hiển thị ảnh, giá
def lay_thong_tin_sp(index):
    row = df_sanpham.iloc[index]
    # Xử lý hình ảnh (Dữ liệu có thể là string hoặc mảng)
    img_val = row.get('image', '')
    img = img_val if isinstance(img_val, str) else 'https://via.placeholder.com/300'
    images_arr = row.get('images', [])
    if isinstance(images_arr, list) and len(images_arr) > 0 and isinstance(images_arr[0], dict) and 'url' in images_arr[0]:
        img = images_arr[0]['url']
        
    return {
        '_id': str(row['_id']),
        'name': str(row.get('name', '')),
        'price': int(row.get('price', 0)) if pd.notnull(row.get('price')) else 0,
        'image': img
    }

# 5. Tạo API bằng Flask
@app.route('/api', methods=['GET'])
def get_data():
    ket_qua = []
    productid = request.args.get('id')
    
    if not productid:
        return jsonify({'error': 'ID sản phẩm bị thiếu'}), 400

    if productid not in df_sanpham['_id'].values:
        return jsonify({'error': 'Sản phẩm không tồn tại'}), 404

    # Lấy index dòng dữ liệu của sản phẩm đang xem
    product_index = df_sanpham.index[df_sanpham['_id'] == productid].tolist()[0]
    similarProduct = list(enumerate(similar[product_index]))
    sortedSimilarProduct = sorted(similarProduct, key=lambda x: x[1], reverse=True)

    limit = min(4, len(df_sanpham) - 1)
    for i in range(1, limit + 1):
        sp = lay_thong_tin_sp(sortedSimilarProduct[i][0])
        ket_qua.append(sp)

    return jsonify({'san pham goi y': ket_qua})

if __name__ == '__main__':
    # Chạy server tại port 5555 (Thêm debug=True để tự động restart khi sửa code)
    app.run(port=5555, debug=True)