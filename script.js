    async function translateMessage(text, targetLang) {
        try {
            // 使用Microsoft Azure翻译API
            const url = 'https://api.cognitive.microsofttranslator.com/translate';
            const params = new URLSearchParams({
                'api-version': '3.0',
                'from': 'auto-detect',
                'to': targetLang
            });

            const response = await fetch(`${url}?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': 'YOUR_SUBSCRIPTION_KEY',
                    'Ocp-Apim-Subscription-Region': 'YOUR_REGION'
                },
                body: JSON.stringify([{ text }])
            });

            if (!response.ok) {
                throw new Error('Translation API request failed');
            }

            const result = await response.json();
            if (result && result[0] && result[0].translations && result[0].translations[0]) {
                return result[0].translations[0].text;
            }

            throw new Error('Invalid translation response');
        } catch (error) {
            console.error('Primary Translation Error:', error);
            
            // 尝试使用备用翻译API
            try {
                const backupUrl = `https://api-free.deepl.com/v2/translate`;
                const formData = new URLSearchParams();
                formData.append('text', text);
                formData.append('target_lang', targetLang.toUpperCase());
                
                const backupResponse = await fetch(backupUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'DeepL-Auth-Key YOUR_AUTH_KEY',
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData
                });

                if (!backupResponse.ok) {
                    throw new Error('Backup translation failed');
                }

                const backupData = await backupResponse.json();
                if (backupData.translations && backupData.translations[0]) {
                    return backupData.translations[0].text;
                }
            } catch (backupError) {
                console.error('Backup Translation Error:', backupError);
                
                // 如果两个API都失败，尝试使用浏览器内置的翻译API
                try {
                    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    if (data && data[0]) {
                        let translatedText = '';
                        // 合并所有翻译片段
                        data[0].forEach(item => {
                            if (item[0]) {
                                translatedText += item[0];
                            }
                        });
                        
                        if (translatedText) {
                            return translatedText;
                        }
                    }
                } catch (googleError) {
                    console.error('Google Translation Error:', googleError);
                }
            }
            
            throw new Error('All translation services failed');
        }
    }
