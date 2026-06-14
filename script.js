// 通用脚本：菜单、相册上传/预览、localStorage 简易数据存储、视频/美食/攻略的本地保存
document.addEventListener('DOMContentLoaded', ()=>{
  // 菜单
  const btn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (btn) btn.addEventListener('click', ()=> {
    if (nav.style.display === 'flex') nav.style.display = 'none';
    else nav.style.display = 'flex';
  });

  // 最近分享（首页）
  const recentList = document.getElementById('recent-list');
  const loadRecent = ()=>{
    const photos = JSON.parse(localStorage.getItem('photos')||'[]');
    const foods = JSON.parse(localStorage.getItem('foods')||'[]');
    const guides = JSON.parse(localStorage.getItem('guides')||'[]');
    const items = [];
    photos.slice(-3).reverse().forEach(p=>items.push({type:'photo',title:p.name||'照片',thumb:p.data}));
    foods.slice(-2).reverse().forEach(f=>items.push({type:'food',title:f.name,thumb:f.img}));
    guides.slice(-2).reverse().forEach(g=>items.push({type:'guide',title:g.title}));
    if (recentList){
      recentList.innerHTML = items.slice(0,6).map(it=>{
        return `<div class="card" style="padding:.5rem">
          ${it.thumb?`<img src="${it.thumb}" style="height:100px;object-fit:cover">`:'<div style="height:100px;background:#f0f4f6;border-radius:6px"></div>'}
          <h4 style="margin:.5rem 0">${it.title}</h4>
        </div>`;
      }).join('');
    }
  };
  loadRecent();

  // 相册：上传与 modal
  const photoInput = document.getElementById('photo-input');
  const gallery = document.getElementById('photo-gallery');
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const modalClose = document.getElementById('modal-close');

  const renderGallery = ()=>{
    const photos = JSON.parse(localStorage.getItem('photos')||'[]');
    if (!gallery) return;
    // 保留示例图片如果 localStorage 没内容则显示默认图
    gallery.innerHTML = photos.length===0 ? gallery.innerHTML : photos.map(p=>`<img src="${p.data}" alt="${p.name||''}" />`).join('');
    // 绑定点击
    gallery.querySelectorAll('img').forEach(img=>{
      img.addEventListener('click', ()=> {
        if (!modal) return;
        modalImg.src = img.src;
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden','false');
      });
    });
  };
  renderGallery();

  modalClose?.addEventListener('click', ()=>{ modal.style.display='none'; modal.setAttribute('aria-hidden','true'); });
  modal?.addEventListener('click', (e)=>{ if (e.target === modal) { modal.style.display='none'; modal.setAttribute('aria-hidden','true'); } });

  photoInput?.addEventListener('change', (e)=>{
    const files = Array.from(e.target.files).slice(0,10);
    const limit = 10; // 最多10张
    const reads = files.map(f=>new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ()=> res({name:f.name, data:r.result});
      r.onerror = rej;
      r.readAsDataURL(f);
    }));
    Promise.all(reads).then(results=>{
      const photos = JSON.parse(localStorage.getItem('photos')||'[]');
      const merged = photos.concat(results).slice(-200); // 保留最多200张
      localStorage.setItem('photos', JSON.stringify(merged));
      renderGallery(); loadRecent();
      alert('图片已保存（本地 localStorage，仅用于作业演示）');
      photoInput.value = '';
    }).catch(()=>alert('读取图片失败'));
  });

  // 导出/导入相册
  const exportBtn = document.getElementById('export-photos');
  const importBtn = document.getElementById('import-photos');
  exportBtn?.addEventListener('click', ()=>{
    const data = localStorage.getItem('photos')||'[]';
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'photos.json'; a.click(); URL.revokeObjectURL(url);
  });
  importBtn?.addEventListener('click', ()=>{
    const text = prompt('请粘贴 JSON（从导出文件中获取）');
    try{
      const arr = JSON.parse(text||'[]');
      if (!Array.isArray(arr)) throw new Error('不是数组');
      localStorage.setItem('photos', JSON.stringify(arr));
      renderGallery(); loadRecent();
      alert('导入成功');
    }catch(e){ alert('导入失败：' + e.message); }
  });

  // 视频：添加外链
  const addVideoBtn = document.getElementById('add-video');
  addVideoBtn?.addEventListener('click', ()=>{
    const url = document.getElementById('video-url').value.trim();
    if (!url) return alert('请输入视频链接');
    const listEl = document.getElementById('video-list');
    const vidHtml = videoCardHtml(url);
    listEl.insertAdjacentHTML('beforeend', vidHtml);
    document.getElementById('video-url').value = '';
    // 保存到 localStorage
    const videos = JSON.parse(localStorage.getItem('videos')||'[]');
    videos.push({url, created:Date.now()});
    localStorage.setItem('videos', JSON.stringify(videos));
    loadRecent();
  });

  const videoCardHtml = (url)=> {
    if (url.includes('youtube.com') || url.includes('youtu.be')){
      // 转换为 embed
      let id = '';
      const y1 = url.match(/v=([^&]+)/);
      const y2 = url.match(/youtu\.be\/([^?&]+)/);
      id = y1 ? y1[1] : (y2 ? y2[1] : '');
      const src = id ? `https://www.youtube.com/embed/${id}` : url;
      return `<div class="video-card card"><iframe width="100%" height="200" src="${src}" frameborder="0" allowfullscreen></iframe><h4>视频</h4></div>`;
    } else {
      // 直接当作 src
      return `<div class="video-card card"><video controls width="100%" height="200"><source src="${url}"></video><h4>视频</h4></div>`;
    }
  };

  // 加载已有视频（localStorage）
  const loadVideos = ()=>{
    const videos = JSON.parse(localStorage.getItem('videos')||'[]');
    const listEl = document.getElementById('video-list');
    if (!listEl) return;
    videos.forEach(v=> listEl.insertAdjacentHTML('beforeend', videoCardHtml(v.url)));
  };
  loadVideos();

  // 美食：发布与展示
  const foodForm = document.getElementById('food-form');
  const foodListEl = document.getElementById('food-list');
  const renderFoods = ()=>{
    const foods = JSON.parse(localStorage.getItem('foods')||'[]');
    if (!foodListEl) return;
    foodListEl.innerHTML = foods.map(f=>`<div class="card"><img src="${f.img||'assets/food1.svg'}" style="height:140px;object-fit:cover"><div style="padding:.6rem"><h4>${f.name}</h4><p>${f.place||''}</p><p style="color:#475569">${f.desc||''}</p></div></div>`).join('');
  };
  renderFoods();
  foodForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('food-name').value.trim();
    if (!name) return alert('请填写名称');
    const place = document.getElementById('food-place').value.trim();
    const img = document.getElementById('food-img').value.trim();
    const desc = document.getElementById('food-desc').value.trim();
    const foods = JSON.parse(localStorage.getItem('foods')||'[]');
    foods.push({name,place,img,desc,created:Date.now()});
    localStorage.setItem('foods', JSON.stringify(foods));
    renderFoods(); loadRecent();
    foodForm.reset();
    alert('美食已发布（本地保存）');
  });

  // 攻略：发布与展示
  const guideForm = document.getElementById('guide-form');
  const guidesList = document.getElementById('guides-list');
  const renderGuides = ()=>{
    const guides = JSON.parse(localStorage.getItem('guides')||'[]');
    if (!guidesList) return;
    guidesList.innerHTML = guides.map(g=>`<div class="card" style="padding:.6rem"><h4>${g.title}</h4><p style="white-space:pre-wrap;color:#475569">${g.content}</p></div>`).join('');
  };
  renderGuides();
  guideForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const title = document.getElementById('guide-title').value.trim();
    const content = document.getElementById('guide-content').value.trim();
    if (!title || !content) return alert('请填写标题和内容');
    const guides = JSON.parse(localStorage.getItem('guides')||'[]');
    guides.push({title,content,created:Date.now()});
    localStorage.setItem('guides', JSON.stringify(guides));
    renderGuides(); loadRecent();
    guideForm.reset();
    alert('攻略已发布（本地保存）');
  });

  // 加载最近（更新首页）
  loadRecent();
});
