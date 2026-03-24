const UPDATE_EXPIRATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function getUpdates(filters, marks) {
    const save = JSON.parse(localStorage.getItem('auriga_marks_save') || '{}');
    const updates = JSON.parse(localStorage.getItem('auriga_updates') || '{}');

    const key = JSON.stringify(filters);
    const previous = save[key];

    if (!previous) {
        save[key] = marks;
        localStorage.setItem('auriga_marks_save', JSON.stringify(save));
        return [];
    }

    // Skip if all marks have no values (can happen briefly after login)
    if (marks.every(m => m.subjects.every(s => s.marks.every(mk => mk.value === undefined)))) {
        return [];
    }

    let result = updates[key] || [];

    for (const module of marks) {
        const prevModule = previous.find(m => m.name === module.name);
        if (!prevModule) continue;

        for (const subject of module.subjects) {
            const prevSubject = prevModule.subjects.find(s => s.name === subject.name);
            if (!prevSubject) continue;

            for (const { id, name, value, classAverage } of subject.marks) {
                const prevMark = prevSubject.marks.find(m => m.id === id && m.name === name);

                if (!prevMark) {
                    if (value !== null) {
                        pushUpdate(result, subject.id, 'add', id, name, value);
                    }
                } else if (prevMark.value !== value) {
                    let type = 'update';
                    if (prevMark.value === undefined) type = 'add';
                    else if (value === undefined) type = 'remove';
                    pushUpdate(result, subject.id, type, id, name, value, prevMark.value);
                } else if (prevMark.classAverage !== classAverage) {
                    pushUpdate(result, subject.id, 'average-update', id, name, classAverage, prevMark.classAverage);
                }
            }

            for (const mark of prevSubject.marks) {
                if (!subject.marks.find(m => m.name === mark.name)) {
                    pushUpdate(result, subject.id, 'remove', mark.id, mark.name, undefined, mark.value);
                }
            }
        }
    }

    result = removeExpired(result).sort((a, b) => new Date(b.date) - new Date(a.date));

    save[key] = marks;
    updates[key] = result;
    localStorage.setItem('auriga_marks_save', JSON.stringify(save));
    localStorage.setItem('auriga_updates', JSON.stringify(updates));

    return result;
}

/**
 * Add or merge an update entry into the result list.
 */
function pushUpdate(result, subjectId, type, id, name, value, old) {
    const existing = result.find(u => u.subject === subjectId && u.id === id && u.name === name);

    if (existing && (!(existing.type === 'average-update' || type === 'average-update') || existing.type === type)) {
        existing.type = type;
        existing.date = new Date();
        existing.value = value;
        existing.old = old;
        return;
    }

    result.push({
        date: new Date(),
        type,
        subject: subjectId,
        id,
        name,
        ...(value != null ? { value } : {}),
        ...(old != null ? { old } : {}),
    });
}

/**
 * Remove updates older than the expiration delay.
 */
function removeExpired(updates) {
    const cutoff = Date.now() - UPDATE_EXPIRATION_MS;
    return updates.filter(u => new Date(u.date).getTime() > cutoff);
}
