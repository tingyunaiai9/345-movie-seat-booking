/**
 * 电影院票务系统 - 成员管理模块
 * 负责个人票和团体票的成员管理功能
 */

// ========================= 个人票成员管理状态 =========================
const IndividualMemberState = {
    memberCount: 0,
    maxMembers: 10
};

// ========================= 团体成员管理 =========================

/**
 * 初始化团体成员管理
 */
function initializeGroupMemberManagement() {
    const memberList = document.querySelector('.group-controls .member-list');
    const addMemberBtn = document.getElementById('add-member');
    const memberNameInput = document.getElementById('member-name');
    const memberAgeInput = document.getElementById('member-age');
    const memberCountSpan = document.getElementById('member-count');

    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', function() {
            const name = memberNameInput.value.trim();
            const age = memberAgeInput.value.trim();

            console.log(`添加成员: 姓名=${name}, 年龄=${age}`);

            if (!validateMemberInput(name, age)) {
                return;
            }

            // 添加成员到列表
            addMemberToList(memberList, name, age);

            // 清空输入框
            memberNameInput.value = '';
            memberAgeInput.value = '';

            // 更新计数
            if (window.UICoreModule && window.UICoreModule.uiState) {
                window.UICoreModule.uiState.memberCount++;
                updateMemberCount(memberCountSpan);
            }

            console.log('团体成员添加成功:', name, age);
        });

        // 支持回车键添加
        if (memberNameInput && memberAgeInput) {
            [memberNameInput, memberAgeInput].forEach(input => {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        addMemberBtn.click();
                    }
                });
            });
        }
    } else {
        console.error('团体票成员管理初始化失败:', {
            memberList: !!memberList,
            addMemberBtn: !!addMemberBtn
        });
    }
}

/**
 * 验证成员输入
 * @param {string} name - 成员姓名
 * @param {string} age - 成员年龄
 * @returns {boolean} 是否有效
 */
function validateMemberInput(name, age) {
    const showMessage = window.UICoreModule ? window.UICoreModule.showMessage : alert;
    const uiState = window.UICoreModule ? window.UICoreModule.uiState : { memberCount: 0, maxMembers: 20 };

    if (!name) {
        showMessage('请输入成员姓名', 'error');
        return false;
    }

    if (!age || age < 1 || age > 120) {
        showMessage('请输入有效年龄（1-120）', 'error');
        return false;
    }

    if (uiState.memberCount >= uiState.maxMembers) {
        showMessage(`最多只能添加${uiState.maxMembers}名成员`, 'error');
        return false;
    }

    return true;
}

/**
 * 添加成员到列表
 * @param {HTMLElement} memberList - 成员列表容器
 * @param {string} name - 成员姓名
 * @param {string} age - 成员年龄
 */
function addMemberToList(memberList, name, age) {
    const memberItem = document.createElement('div');
    memberItem.className = 'member-item';
    memberItem.innerHTML = `
        <div class="member-info">
            <span class="member-name">${name}</span>
            <span class="member-age">${age}岁</span>
            <span class="member-type">团体票</span>
        </div>
        <button class="remove-member" onclick="UIMemberManagement.removeMember(this)">删除</button>
    `;
    memberList.appendChild(memberItem);
    console.log('添加成员到列表:', name, age);
}

/**
 * 删除成员
 * @param {HTMLElement} button - 删除按钮
 */
function removeMember(button) {
    const memberItem = button.parentElement;
    memberItem.remove();

    if (window.UICoreModule && window.UICoreModule.uiState) {
        window.UICoreModule.uiState.memberCount--;
        const memberCountSpan = document.getElementById('member-count');
        updateMemberCount(memberCountSpan);
    }
}

/**
 * 更新成员计数显示
 * @param {HTMLElement} memberCountSpan - 计数显示元素
 */
function updateMemberCount(memberCountSpan) {
    if (memberCountSpan && window.UICoreModule && window.UICoreModule.uiState) {
        memberCountSpan.textContent = window.UICoreModule.uiState.memberCount;
    }
}

/**
 * 获取团体成员列表
 */
function getGroupMembersList() {
    const memberItems = document.querySelectorAll('#group-member-list .member-item');
    return Array.from(memberItems).map(item => {
        const name = item.querySelector('.member-name').textContent;
        const ageText = item.querySelector('.member-age').textContent;
        const age = parseInt(ageText.replace('岁', ''));
        return { name, age };
    });
}

// ========================= 个人票成员管理 =========================

/**
 * 初始化个人票成员管理
 */
function initializeIndividualMemberManagement() {
    const addMemberBtn = document.getElementById('add-individual-member');
    const memberNameInput = document.getElementById('individual-member-name');
    const memberAgeInput = document.getElementById('individual-member-age');

    if (addMemberBtn && memberNameInput && memberAgeInput) {
        addMemberBtn.addEventListener('click', function() {
            const name = memberNameInput.value.trim();
            const age = memberAgeInput.value.trim();

            console.log(`添加个人票成员: 姓名=${name}, 年龄=${age}`);

            if (!validateIndividualMemberInput(name, age)) {
                return;
            }

            // 添加成员到列表
            addIndividualMember(name, age);

            // 清空输入框
            memberNameInput.value = '';
            memberAgeInput.value = '';

            // 更新计数
            IndividualMemberState.memberCount++;
            updateIndividualMemberCount();

            console.log('个人票成员添加成功:', name, age);
        });

        // 支持回车键添加
        [memberNameInput, memberAgeInput].forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addMemberBtn.click();
                }
            });
        });
    } else {
        console.error('个人票成员管理初始化失败:', {
            addMemberBtn: !!addMemberBtn,
            memberNameInput: !!memberNameInput,
            memberAgeInput: !!memberAgeInput
        });
    }
}

/**
 * 验证个人票成员输入
 * @param {string} name - 成员姓名
 * @param {string} age - 成员年龄
 * @returns {boolean} 是否有效
 */
function validateIndividualMemberInput(name, age) {
    const showMessage = window.UICoreModule ? window.UICoreModule.showMessage : alert;

    if (!name) {
        showMessage('请输入成员姓名', 'error');
        return false;
    }

    if (name.length > 20) {
        showMessage('姓名长度不能超过20个字符', 'error');
        return false;
    }

    if (!age || age < 1 || age > 120) {
        showMessage('请输入有效年龄（1-120）', 'error');
        return false;
    }

    if (IndividualMemberState.memberCount >= IndividualMemberState.maxMembers) {
        showMessage(`最多只能添加${IndividualMemberState.maxMembers}名成员`, 'error');
        return false;
    }

    return true;
}

/**
 * 添加个人票成员
 * @param {string} name - 成员姓名
 * @param {string} age - 成员年龄
 */
function addIndividualMember(name, age) {
    const memberList = document.getElementById('individual-member-list');
    if (!memberList) {
        console.error('未找到个人票成员列表容器');
        return;
    }

    const memberItem = document.createElement('div');
    memberItem.className = 'member-item';
    memberItem.innerHTML = `
        <div class="member-info">
            <span class="member-name">${name}</span>
            <span class="member-age">${age}岁</span>
            <span class="member-type">个人票</span>
        </div>
        <button class="remove-member" onclick="UIMemberManagement.removeIndividualMember(this)">删除</button>
    `;
    memberList.appendChild(memberItem);
    console.log('添加个人票成员到列表:', name, age);
}

/**
 * 删除个人票成员
 * @param {HTMLElement} button - 删除按钮
 */
function removeIndividualMember(button) {
    const memberItem = button.parentElement;
    memberItem.remove();
    IndividualMemberState.memberCount--;
    updateIndividualMemberCount();
}

/**
 * 更新个人票成员计数显示
 */
function updateIndividualMemberCount() {
    const memberCountSpan = document.getElementById('individual-member-count');
    if (memberCountSpan) {
        memberCountSpan.textContent = IndividualMemberState.memberCount;
    }
}

/**
 * 获取个人票成员列表
 * @returns {Array} 个人票成员数组
 */
function getIndividualMembersList() {
    const memberItems = document.querySelectorAll('#individual-member-list .member-item');
    return Array.from(memberItems).map(item => {
        const name = item.querySelector('.member-name').textContent;
        const ageText = item.querySelector('.member-age').textContent;
        const age = parseInt(ageText.replace('岁', ''));
        return { name, age };
    });
}

// ========================= 客户数据获取 =========================

/**
 * 获取客户数据（兼容StateManager）
 */
function getMyCustomerDataEnhanced() {
    const uiState = window.UICoreModule ? window.UICoreModule.uiState : { ticketType: 'individual' };

    if (uiState.ticketType === 'individual') {
        // 个人票：返回成员列表
        const members = getIndividualMembersList();
        return {
            ticketType: 'individual',
            members: members,
            totalCount: members.length,
            // 向后兼容的字段
            name: members.length > 0 ? members[0].name : '未填写',
            age: members.length > 0 ? members[0].age : '未填写',
            // phone: document.getElementById('individual-phone')?.value || '未填写'
        };
    } else {
        // 团体票：返回团体信息
        const groupMembers = getGroupMembersList();
        return {
            ticketType: 'group',
            members: groupMembers,
            totalCount: groupMembers.length,
            // 向后兼容的字段
            name: document.getElementById('customer-name')?.value || '未填写',
            age: document.getElementById('customer-age')?.value || '未填写',
            // phone: document.getElementById('customer-phone')?.value || '未填写'
        };
    }
}

// ========================= 清除成员信息 =========================

/**
 * 清除所有成员信息（团体票和个人票）
 */
function clearMembers() {
    // 清除团体成员
    const groupList = document.querySelector('.group-controls .member-list') || document.getElementById('group-member-list');
    if (groupList) {
        groupList.innerHTML = '';
    }
    if (window.UICoreModule && window.UICoreModule.uiState) {
        window.UICoreModule.uiState.memberCount = 0;
        const memberCountSpan = document.getElementById('member-count');
        updateMemberCount(memberCountSpan);
    }

    // 清除个人票成员
    const individualList = document.getElementById('individual-member-list');
    if (individualList) {
        individualList.innerHTML = '';
    }
    IndividualMemberState.memberCount = 0;
    updateIndividualMemberCount();
}

// ========================= 模块导出 =========================

// 在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.UIMemberManagement = {
        // 团体成员管理
        initializeGroupMemberManagement,
        addMemberToList,
        removeMember,
        updateMemberCount,
        getGroupMembersList,

        // 个人票成员管理
        initializeIndividualMemberManagement,
        addIndividualMember,
        removeIndividualMember,
        updateIndividualMemberCount,
        getIndividualMembersList,

        // 客户数据获取
        getMyCustomerDataEnhanced,

        // 状态访问
        getIndividualMemberState: () => IndividualMemberState,

        // 清除成员
        clearMembers
    };
}

console.log('UI成员管理模块已加载');
