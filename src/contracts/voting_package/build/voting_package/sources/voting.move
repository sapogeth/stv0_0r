#[allow(lint(self_transfer))] // Подавляем предупреждение о передаче отправителю
module voting_package::voting {
    use sui::object::{UID};
    use sui::transfer;
    use sui::tx_context::{TxContext};
    use std::vector;

    // Структура для хранения данных голосования
    public struct Voting has key, store {
        id: UID,
        options: vector<vector<u8>>, // Варианты голосования как векторы байтов
        votes: vector<u64>,          // Количество голосов для каждого варианта
        is_active: bool,             // Активно ли голосование
    }

    // Инициализация нового голосования
    public fun init_voting(ctx: &mut TxContext) {
        let mut voting = Voting {
            id: object::new(ctx),
            options: vector[vector::empty<u8>(), vector::empty<u8>()],
            votes: vector[0, 0],
            is_active: true,
        };
        // Инициализация вариантов "Yes" и "No" как vector<u8>
        *vector::borrow_mut(&mut voting.options, 0) = b"Yes";
        *vector::borrow_mut(&mut voting.options, 1) = b"No";
        transfer::transfer(voting, tx_context::sender(ctx));
    }

    // Проголосовать за вариант (индекс 0 для "Yes", 1 для "No")
    public fun vote(voting: &mut Voting, option_index: u64, _ctx: &mut TxContext) {
        assert!(voting.is_active, 0); // Проверка, активно ли голосование
        assert!(option_index < vector::length(&voting.options), 1); // Проверка валидности индекса
        let votes = &mut voting.votes;
        let current_votes = vector::borrow_mut(votes, option_index);
        *current_votes = *current_votes + 1;
    }

    // Завершить голосование
    public fun end_voting(voting: &mut Voting) {
        voting.is_active = false;
    }

    // Получить результаты
    public fun get_results(voting: &Voting): (vector<vector<u8>>, vector<u64>) {
        (voting.options, voting.votes)
    }
}