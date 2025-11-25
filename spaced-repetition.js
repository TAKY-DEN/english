/**
 * نظام التكرار المتباعد (Spaced Repetition System)
 * يعتمد على localStorage للحفظ المحلي بدون مزامنة
 */

class SpacedRepetitionSystem {
    constructor() {
        this.storageKey = 'spacedRepetitionData';
        this.intervals = [1, 3, 7, 14, 30]; // أيام المراجعة: بعد يوم، 3 أيام، أسبوع، أسبوعين، شهر
    }

    /**
     * حفظ كلمة/جملة في نظام التكرار المتباعد
     * @param {string} level - المستوى (a1, a2, b1, b2, c1, c2)
     * @param {string} type - النوع (vocab, sentence)
     * @param {number} id - معرف الكلمة/الجملة
     * @param {object} data - بيانات الكلمة/الجملة (english, arabic, pronunciation)
     */
    saveItem(level, type, id, data) {
        const allData = this.getAllData();
        const key = `${level}_${type}_${id}`;
        
        // إذا كانت الكلمة موجودة، نحدث البيانات فقط
        if (allData[key]) {
            allData[key].data = data;
            allData[key].lastModified = new Date().toISOString();
        } else {
            // كلمة جديدة - نضيفها مع تاريخ الحفظ
            allData[key] = {
                level: level,
                type: type,
                id: id,
                data: data,
                savedDate: new Date().toISOString(),
                lastReviewed: null,
                reviewCount: 0,
                nextReviewDate: this.calculateNextReview(0), // أول مراجعة بعد يوم
                lastModified: new Date().toISOString()
            };
        }
        
        this.saveAllData(allData);
        console.log(`✅ تم حفظ: ${data.english} في نظام التكرار المتباعد`);
    }

    /**
     * حساب تاريخ المراجعة القادمة
     * @param {number} reviewCount - عدد المراجعات السابقة
     * @returns {string} - تاريخ المراجعة القادمة
     */
    calculateNextReview(reviewCount) {
        const today = new Date();
        const intervalIndex = Math.min(reviewCount, this.intervals.length - 1);
        const daysToAdd = this.intervals[intervalIndex];
        
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        
        return nextDate.toISOString();
    }

    /**
     * تسجيل مراجعة كلمة/جملة
     * @param {string} key - مفتاح الكلمة (level_type_id)
     * @param {boolean} remembered - هل تذكر المستخدم الكلمة؟
     */
    reviewItem(key, remembered) {
        const allData = this.getAllData();
        
        if (!allData[key]) {
            console.error('❌ الكلمة غير موجودة في النظام');
            return;
        }
        
        const item = allData[key];
        item.lastReviewed = new Date().toISOString();
        
        if (remembered) {
            // إذا تذكر الكلمة، ننتقل للمستوى التالي
            item.reviewCount++;
            item.nextReviewDate = this.calculateNextReview(item.reviewCount);
            console.log(`✅ ممتاز! المراجعة القادمة بعد ${this.intervals[Math.min(item.reviewCount, this.intervals.length - 1)]} يوم`);
        } else {
            // إذا لم يتذكر، نعيده للبداية
            item.reviewCount = 0;
            item.nextReviewDate = this.calculateNextReview(0);
            console.log(`🔄 سنراجعها معاً قريباً - المراجعة القادمة بعد ${this.intervals[0]} يوم`);
        }
        
        this.saveAllData(allData);
    }

    /**
     * الحصول على الكلمات المستحقة للمراجعة اليوم
     * @param {string} level - المستوى (اختياري - إذا لم يحدد، يعرض جميع المستويات)
     * @param {string} type - النوع (اختياري - vocab أو sentence)
     * @returns {array} - قائمة الكلمات المستحقة للمراجعة
     */
    getDueItems(level = null, type = null) {
        const allData = this.getAllData();
        const today = new Date();
        const dueItems = [];
        
        for (const key in allData) {
            const item = allData[key];
            const nextReview = new Date(item.nextReviewDate);
            
            // فلترة حسب المستوى والنوع إذا تم تحديدهما
            if (level && item.level !== level) continue;
            if (type && item.type !== type) continue;
            
            // إذا كان تاريخ المراجعة القادمة قد حان أو مضى
            if (nextReview <= today) {
                dueItems.push({
                    key: key,
                    ...item
                });
            }
        }
        
        // ترتيب حسب تاريخ المراجعة (الأقدم أولاً)
        dueItems.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));
        
        return dueItems;
    }

    /**
     * الحصول على جميع الكلمات المحفوظة
     * @param {string} level - المستوى (اختياري)
     * @param {string} type - النوع (اختياري)
     * @returns {array} - قائمة جميع الكلمات
     */
    getAllItems(level = null, type = null) {
        const allData = this.getAllData();
        const items = [];
        
        for (const key in allData) {
            const item = allData[key];
            
            // فلترة حسب المستوى والنوع إذا تم تحديدهما
            if (level && item.level !== level) continue;
            if (type && item.type !== type) continue;
            
            items.push({
                key: key,
                ...item
            });
        }
        
        // ترتيب حسب تاريخ الحفظ (الأحدث أولاً)
        items.sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate));
        
        return items;
    }

    /**
     * الحصول على إحصائيات المراجعة
     * @param {string} level - المستوى (اختياري)
     * @returns {object} - إحصائيات المراجعة
     */
    getStatistics(level = null) {
        const allItems = this.getAllItems(level);
        const dueItems = this.getDueItems(level);
        
        const stats = {
            total: allItems.length,
            dueToday: dueItems.length,
            reviewed: allItems.filter(item => item.reviewCount > 0).length,
            mastered: allItems.filter(item => item.reviewCount >= this.intervals.length - 1).length,
            byLevel: {}
        };
        
        // إحصائيات لكل مستوى
        const levels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
        levels.forEach(lvl => {
            const levelItems = this.getAllItems(lvl);
            const levelDue = this.getDueItems(lvl);
            
            stats.byLevel[lvl] = {
                total: levelItems.length,
                dueToday: levelDue.length,
                vocab: levelItems.filter(item => item.type === 'vocab').length,
                sentences: levelItems.filter(item => item.type === 'sentence').length
            };
        });
        
        return stats;
    }

    /**
     * إضافة عنصر جديد (اسم بديل لـ saveItem)
     */
    addItem(level, type, id, data) {
        return this.saveItem(level, type, id, data);
    }

    /**
     * إزالة عنصر من النظام
     */
    removeItem(level, type, id) {
        const key = `${level}_${type}_${id}`;
        return this.deleteItem(key);
    }

    /**
     * حذف كلمة من النظام
     * @param {string} key - مفتاح الكلمة
     */
    deleteItem(key) {
        const allData = this.getAllData();
        if (allData[key]) {
            delete allData[key];
            this.saveAllData(allData);
            console.log(`🗑️ تم حذف الكلمة من نظام المراجعة`);
        }
    }

    /**
     * إعادة تعيين جميع البيانات (حذف كل شيء)
     */
    resetAll() {
        if (confirm('⚠️ هل أنت متأكد من حذف جميع بيانات المراجعة؟ لا يمكن التراجع عن هذا الإجراء!')) {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ تم حذف جميع بيانات المراجعة');
            return true;
        }
        return false;
    }

    /**
     * الحصول على جميع البيانات من localStorage
     * @returns {object} - جميع البيانات
     */
    getAllData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    /**
     * حفظ جميع البيانات في localStorage
     * @param {object} data - البيانات المراد حفظها
     */
    saveAllData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    /**
     * تصدير البيانات كملف JSON
     */
    exportData() {
        const data = this.getAllData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `spaced-repetition-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        console.log('📥 تم تصدير البيانات');
    }

    /**
     * استيراد البيانات من ملف JSON
     * @param {File} file - ملف JSON
     */
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (confirm('⚠️ سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟')) {
                this.saveAllData(data);
                console.log('📤 تم استيراد البيانات بنجاح');
                return true;
            }
        } catch (error) {
            console.error('❌ خطأ في استيراد البيانات:', error);
            alert('حدث خطأ في استيراد البيانات. تأكد من أن الملف صحيح.');
        }
        return false;
    }
}

// إنشاء نسخة عامة من النظام
window.SpacedRepetition = new SpacedRepetitionSystem();

console.log('✅ نظام التكرار المتباعد جاهز!');

